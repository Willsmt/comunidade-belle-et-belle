import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { limparBanco } from "@/test-utils/db";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { criarRegraLimiar, aprovarParticipacao } from "./actions";
import { alternarMarcacao, participarDesafioSurpresa } from "@/app/cliente/desafios/actions";
import { obterDesafioAtivoParaCliente } from "@/app/cliente/desafios/queries";

afterEach(async () => {
  await limparBanco();
});

function buildFormData(campos: Record<string, string>) {
  const formData = new FormData();
  for (const [chave, valor] of Object.entries(campos)) {
    formData.set(chave, valor);
  }
  return formData;
}

function sessaoDe(userId: string, papeis: string[]) {
  return { user: { id: userId, papeis } };
}

describe("regra de bônus conectada a um emblema até a Conquista (Postgres real)", () => {
  it("cria a Conquista de verdade quando a cliente satisfaz a regra ligada a um emblema do catálogo", async () => {
    const gestora = await prisma.user.create({
      data: { email: "gestora@x.com", status: "ATIVO", name: "Gestora" },
    });
    const cliente = await prisma.user.create({
      data: { email: "cliente@x.com", status: "ATIVO", name: "Cliente" },
    });
    const emblema = await prisma.emblema.create({ data: { nome: "Disciplina" } });
    const desafio = await prisma.desafio.create({
      data: {
        titulo: "Glow Up",
        dataInicio: new Date("2026-09-01"),
        dataFim: new Date("2026-09-30"),
      },
    });
    const categoria = await prisma.categoriaDesafio.create({
      data: { desafioId: desafio.id, nome: "Pele", cor: "#f5c" },
    });
    const item = await prisma.itemDesafio.create({
      data: { categoriaId: categoria.id, descricao: "Água", pontos: 1 },
    });

    mockAuth.mockResolvedValueOnce(sessaoDe(gestora.id, ["GESTORA"]));
    await criarRegraLimiar(
      desafio.id,
      buildFormData({ limiarItens: "1", pontosExtras: "5", emblemaId: emblema.id }),
    );

    const regra = await prisma.regraBonus.findFirst({ where: { desafioId: desafio.id } });
    expect(regra?.emblemaId).toBe(emblema.id);

    mockAuth.mockResolvedValueOnce(sessaoDe(cliente.id, ["CLIENTE"]));
    await alternarMarcacao(item.id);

    const conquistas = await prisma.conquista.findMany({ where: { clienteId: cliente.id } });
    expect(conquistas).toHaveLength(1);
    expect(conquistas[0]?.emblemaId).toBe(emblema.id);
    expect(conquistas[0]?.tipo).toBe("BONUS");
  });

  it("não cria Conquista quando a regra é criada sem emblema selecionado", async () => {
    const gestora = await prisma.user.create({
      data: { email: "gestora@x.com", status: "ATIVO", name: "Gestora" },
    });
    const cliente = await prisma.user.create({
      data: { email: "cliente@x.com", status: "ATIVO", name: "Cliente" },
    });
    const desafio = await prisma.desafio.create({
      data: {
        titulo: "Glow Up",
        dataInicio: new Date("2026-09-01"),
        dataFim: new Date("2026-09-30"),
      },
    });
    const categoria = await prisma.categoriaDesafio.create({
      data: { desafioId: desafio.id, nome: "Pele", cor: "#f5c" },
    });
    const item = await prisma.itemDesafio.create({
      data: { categoriaId: categoria.id, descricao: "Água", pontos: 1 },
    });

    mockAuth.mockResolvedValueOnce(sessaoDe(gestora.id, ["GESTORA"]));
    await criarRegraLimiar(desafio.id, buildFormData({ limiarItens: "1", pontosExtras: "5" }));

    const regra = await prisma.regraBonus.findFirst({ where: { desafioId: desafio.id } });
    expect(regra?.emblemaId).toBeNull();

    mockAuth.mockResolvedValueOnce(sessaoDe(cliente.id, ["CLIENTE"]));
    await alternarMarcacao(item.id);

    const conquistas = await prisma.conquista.findMany({ where: { clienteId: cliente.id } });
    expect(conquistas).toHaveLength(0);
  });
});

describe("aprovação de desafio surpresa até o ranking (Postgres real)", () => {
  it("os pontos entram no ranking geral da cliente assim que a gestora aprova a participação", async () => {
    const gestora = await prisma.user.create({
      data: { email: "gestora@x.com", status: "ATIVO", name: "Gestora" },
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
    const surpresa = await prisma.desafioSurpresa.create({
      data: {
        desafioId: desafio.id,
        titulo: "Corrida 5km",
        pontos: 50,
        exigeComprovacao: false,
      },
    });

    mockAuth.mockResolvedValueOnce(sessaoDe(cliente.id, ["CLIENTE"]));
    await participarDesafioSurpresa(surpresa.id, new FormData());

    const participacaoPendente = await prisma.participacaoSurpresa.findFirstOrThrow({
      where: { desafioSurpresaId: surpresa.id, clienteId: cliente.id },
    });
    expect(participacaoPendente.validado).toBe(false);

    mockAuth.mockResolvedValueOnce(sessaoDe(cliente.id, ["CLIENTE"]));
    const antesDeAprovar = await obterDesafioAtivoParaCliente();
    expect(antesDeAprovar?.rankingGeral).toEqual([]);

    mockAuth.mockResolvedValueOnce(sessaoDe(gestora.id, ["GESTORA", "ADMIN"]));
    await aprovarParticipacao(participacaoPendente.id);

    const participacaoAprovada = await prisma.participacaoSurpresa.findUniqueOrThrow({
      where: { id: participacaoPendente.id },
    });
    expect(participacaoAprovada.validado).toBe(true);
    expect(participacaoAprovada.validadoPor).toBe(gestora.id);

    mockAuth.mockResolvedValueOnce(sessaoDe(cliente.id, ["CLIENTE"]));
    const depoisDeAprovar = await obterDesafioAtivoParaCliente();

    expect(depoisDeAprovar?.rankingGeral).toEqual([
      { clienteId: cliente.id, nome: "Cliente", pontos: 50, fotoUrl: null },
    ]);
  });
});
