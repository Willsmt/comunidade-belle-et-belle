import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { limparBanco } from "@/test-utils/db";

const {
  mockAuth,
  mockUploadComprovanteItem,
  mockApagarObjeto,
  mockGerarUrlAssinadaItem,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockUploadComprovanteItem: vi.fn(),
  mockApagarObjeto: vi.fn(),
  mockGerarUrlAssinadaItem: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/storage/comprovantes-item-desafio", () => ({
  uploadComprovanteItem: mockUploadComprovanteItem,
  gerarUrlAssinada: mockGerarUrlAssinadaItem,
}));
vi.mock("@/lib/storage/objetos", () => ({
  apagarObjetoEmMelhorEsforco: mockApagarObjeto,
}));
vi.mock("@/lib/storage/comprovantes-surpresa", () => ({
  gerarUrlAssinada: vi.fn().mockResolvedValue(null),
}));

import { listarPendentes, listarComprovacoesPendentes } from "./queries";
import { aprovarMarcacaoItem, rejeitarMarcacaoItem } from "./actions";
import { marcarItemComFoto } from "@/app/cliente/desafios/actions";
import { obterDesafioAtivoParaCliente } from "@/app/cliente/desafios/queries";

afterEach(async () => {
  await limparBanco();
});

describe("listarPendentes (Postgres real)", () => {
  it("retorna só usuários PENDENTE, mais antigos primeiro", async () => {
    await prisma.user.create({
      data: { email: "ativa@example.com", status: "ATIVO", name: "Ativa" },
    });
    const primeira = await prisma.user.create({
      data: { email: "pendente1@example.com", status: "PENDENTE", name: "Primeira" },
    });
    await new Promise((r) => setTimeout(r, 10));
    const segunda = await prisma.user.create({
      data: { email: "pendente2@example.com", status: "PENDENTE", name: "Segunda" },
    });

    const resultado = await listarPendentes();

    expect(resultado.map((u) => u.id)).toEqual([primeira.id, segunda.id]);
  });
});

describe("listarComprovacoesPendentes → aprovar/rejeitar (Postgres real)", () => {
  it("lista item e desafio surpresa pendentes juntos; aprovar libera o ranking; rejeitar libera nova marcação", async () => {
    const patty = await prisma.user.create({
      data: { email: "patty@x.com", status: "ATIVO", name: "Patty" },
    });
    const cliente = await prisma.user.create({
      data: { email: "cliente@x.com", status: "ATIVO", name: "Cliente" },
    });

    const desafio = await prisma.desafio.create({
      data: {
        titulo: "Glow Up",
        dataInicio: new Date("2026-09-01"),
        dataFim: new Date("2026-09-30"),
        ativo: true,
      },
    });
    const categoria = await prisma.categoriaDesafio.create({
      data: { desafioId: desafio.id, nome: "Corpo", cor: "#f5c" },
    });
    const item = await prisma.itemDesafio.create({
      data: {
        categoriaId: categoria.id,
        descricao: "Ida à academia",
        pontos: 10,
        exigeFoto: true,
      },
    });
    const surpresa = await prisma.desafioSurpresa.create({
      data: { desafioId: desafio.id, titulo: "Corrida 5km", pontos: 50 },
    });
    await prisma.participacaoSurpresa.create({
      data: { desafioSurpresaId: surpresa.id, clienteId: cliente.id },
    });

    mockUploadComprovanteItem.mockResolvedValue("comprovantes-item/cliente-x/abc.webp");
    mockGerarUrlAssinadaItem.mockResolvedValue("https://url-assinada.exemplo");
    mockAuth.mockResolvedValue({ user: { id: cliente.id, papeis: ["CLIENTE"] } });
    const arquivo = new File(["conteudo"], "foto.png", { type: "image/png" });
    const formData = new FormData();
    formData.set("foto", arquivo);
    await marcarItemComFoto(item.id, formData);

    const pendentesAntes = await listarComprovacoesPendentes();
    expect(pendentesAntes.itens).toHaveLength(1);
    expect(pendentesAntes.participacoesSurpresa).toHaveLength(1);

    const marcacaoPendente = await prisma.marcacaoItem.findFirstOrThrow({
      where: { itemId: item.id, clienteId: cliente.id },
    });

    mockAuth.mockResolvedValue({ user: { id: patty.id, papeis: ["ADMIN"] } });
    await aprovarMarcacaoItem(marcacaoPendente.id);

    const marcacaoAprovada = await prisma.marcacaoItem.findUniqueOrThrow({
      where: { id: marcacaoPendente.id },
    });
    expect(marcacaoAprovada.validado).toBe(true);
    expect(marcacaoAprovada.fotoChave).toBeNull();
    expect(mockApagarObjeto).toHaveBeenCalledWith(
      "comprovantes-item/cliente-x/abc.webp",
      "aprovarMarcacaoItem",
    );

    mockAuth.mockResolvedValue({ user: { id: cliente.id, papeis: ["CLIENTE"] } });
    const resultado = await obterDesafioAtivoParaCliente();
    expect(resultado?.rankingGeral).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ clienteId: cliente.id, pontos: 10 }),
      ]),
    );

    // segundo item pendente, agora pra testar rejeição
    const item2 = await prisma.itemDesafio.create({
      data: {
        categoriaId: categoria.id,
        descricao: "Corrida",
        pontos: 8,
        exigeFoto: true,
      },
    });
    mockAuth.mockResolvedValue({ user: { id: cliente.id, papeis: ["CLIENTE"] } });
    mockUploadComprovanteItem.mockResolvedValue("comprovantes-item/cliente-x/def.webp");
    await marcarItemComFoto(item2.id, formData);
    const marcacaoParaRejeitar = await prisma.marcacaoItem.findFirstOrThrow({
      where: { itemId: item2.id, clienteId: cliente.id },
    });

    mockAuth.mockResolvedValue({ user: { id: patty.id, papeis: ["ADMIN"] } });
    await rejeitarMarcacaoItem(marcacaoParaRejeitar.id);

    expect(
      await prisma.marcacaoItem.findUnique({ where: { id: marcacaoParaRejeitar.id } }),
    ).toBeNull();
    expect(mockApagarObjeto).toHaveBeenCalledWith(
      "comprovantes-item/cliente-x/def.webp",
      "rejeitarMarcacaoItem",
    );

    mockAuth.mockResolvedValue({ user: { id: cliente.id, papeis: ["CLIENTE"] } });
    mockUploadComprovanteItem.mockResolvedValue("comprovantes-item/cliente-x/ghi.webp");
    await marcarItemComFoto(item2.id, formData);
    const novaMarcacao = await prisma.marcacaoItem.findFirstOrThrow({
      where: { itemId: item2.id, clienteId: cliente.id },
    });
    expect(novaMarcacao.validado).toBe(false);
  });
});
