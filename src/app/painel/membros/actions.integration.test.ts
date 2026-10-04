import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { limparBanco } from "@/test-utils/db";

const { mockAuth, mockApagarObjeto } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockApagarObjeto: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/storage/objetos", () => ({
  apagarObjetoEmMelhorEsforco: mockApagarObjeto,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { deletarMembro } from "./actions";

afterEach(async () => {
  await limparBanco();
  mockAuth.mockReset();
  mockApagarObjeto.mockReset();
});

async function cenario() {
  const admin = await prisma.user.create({
    data: {
      email: "admin@teste.com",
      status: "ATIVO",
      papeis: { create: { papel: "ADMIN" } },
    },
  });
  const parceria = await prisma.user.create({
    data: { email: "parceria@teste.com", status: "ATIVO" },
  });
  const cliente = await prisma.user.create({
    data: { email: "cliente@teste.com", status: "ATIVO" },
  });
  const outra = await prisma.user.create({
    data: { email: "outra@teste.com", status: "ATIVO" },
  });

  await prisma.perfil.create({
    data: { userId: cliente.id, fotoChave: "perfis-cliente/cliente/foto.webp" },
  });
  await prisma.perfilParceria.create({
    data: {
      usuarioId: cliente.id,
      fotoChave: "perfis-parceria/cliente/foto.webp",
    },
  });
  const foto = await prisma.fotoEvolucao.create({
    data: {
      clienteId: cliente.id,
      chave: "fotos-evolucao/cliente/a.webp",
      publica: true,
    },
  });
  // Post que reaproveita a foto de evolução (mesma chave) e post com upload próprio.
  await prisma.post.create({
    data: {
      autorId: cliente.id,
      imagemChave: foto.chave,
      fotoEvolucaoId: foto.id,
    },
  });
  await prisma.post.create({
    data: { autorId: cliente.id, imagemChave: "posts/cliente/b.webp" },
  });
  await prisma.planoRecebido.create({
    data: {
      clienteId: cliente.id,
      parceriaId: parceria.id,
      tipo: "TREINO",
      arquivoChave: "planos/cliente/plano.pdf",
    },
  });

  const desafio = await prisma.desafio.create({
    data: {
      titulo: "Desafio",
      dataInicio: new Date("2026-09-01"),
      dataFim: new Date("2026-09-30"),
    },
  });
  const categoria = await prisma.categoriaDesafio.create({
    data: { desafioId: desafio.id, nome: "Treino", cor: "#fff" },
  });
  const item = await prisma.itemDesafio.create({
    data: {
      categoriaId: categoria.id,
      descricao: "Treinar",
      pontos: 10,
      exigeFoto: true,
    },
  });
  const surpresa = await prisma.desafioSurpresa.create({
    data: {
      desafioId: desafio.id,
      titulo: "Surpresa",
      pontos: 5,
      exigeComprovacao: true,
    },
  });

  await prisma.jornadaDesafio.create({
    data: {
      desafioId: desafio.id,
      clienteId: cliente.id,
      fotoAntesChave: "jornada-desafio/cliente/antes.webp",
      fotoDepoisChave: "jornada-desafio/cliente/depois.webp",
    },
  });
  await prisma.participacaoSurpresa.create({
    data: {
      desafioSurpresaId: surpresa.id,
      clienteId: cliente.id,
      fotoChave: "comprovantes-surpresa/cliente/c.webp",
    },
  });
  await prisma.marcacaoItem.create({
    data: {
      itemId: item.id,
      clienteId: cliente.id,
      data: new Date("2026-09-05"),
      fotoChave: "comprovantes-item/cliente/d.webp",
      validado: false,
    },
  });

  // Arquivos de outra usuária: não podem ser tocados.
  await prisma.perfil.create({
    data: { userId: outra.id, fotoChave: "perfis-cliente/outra/foto.webp" },
  });
  await prisma.marcacaoItem.create({
    data: {
      itemId: item.id,
      clienteId: outra.id,
      data: new Date("2026-09-05"),
      fotoChave: "comprovantes-item/outra/e.webp",
      validado: false,
    },
  });

  return { admin, cliente, outra };
}

describe("deletarMembro (Postgres real)", () => {
  it("passa ao helper todas as chaves de R2 da usuária e não deixa nenhum registro dela", async () => {
    const { admin, cliente, outra } = await cenario();
    mockAuth.mockResolvedValue({
      user: { id: admin.id, status: "ATIVO", papeis: ["ADMIN"] },
    });
    mockApagarObjeto.mockResolvedValue(undefined);

    await deletarMembro(cliente.id);

    const chavesApagadas = mockApagarObjeto.mock.calls.map(([chave]) => chave);
    expect(chavesApagadas.sort()).toEqual(
      [
        "perfis-cliente/cliente/foto.webp",
        "perfis-parceria/cliente/foto.webp",
        "fotos-evolucao/cliente/a.webp",
        "posts/cliente/b.webp",
        "planos/cliente/plano.pdf",
        "jornada-desafio/cliente/antes.webp",
        "jornada-desafio/cliente/depois.webp",
        "comprovantes-surpresa/cliente/c.webp",
        "comprovantes-item/cliente/d.webp",
      ].sort(),
    );

    expect(await prisma.user.findUnique({ where: { id: cliente.id } })).toBeNull();
    expect(await prisma.perfil.count({ where: { userId: cliente.id } })).toBe(0);
    expect(await prisma.perfilParceria.count({ where: { usuarioId: cliente.id } })).toBe(0);
    expect(await prisma.fotoEvolucao.count({ where: { clienteId: cliente.id } })).toBe(0);
    expect(await prisma.post.count({ where: { autorId: cliente.id } })).toBe(0);
    expect(await prisma.planoRecebido.count({ where: { clienteId: cliente.id } })).toBe(0);
    expect(await prisma.jornadaDesafio.count({ where: { clienteId: cliente.id } })).toBe(0);
    expect(await prisma.participacaoSurpresa.count({ where: { clienteId: cliente.id } })).toBe(0);
    expect(await prisma.marcacaoItem.count({ where: { clienteId: cliente.id } })).toBe(0);

    // Dados da outra usuária seguem intactos.
    expect(await prisma.user.findUnique({ where: { id: outra.id } })).not.toBeNull();
    expect(await prisma.perfil.count({ where: { userId: outra.id } })).toBe(1);
    expect(await prisma.marcacaoItem.count({ where: { clienteId: outra.id } })).toBe(1);
  });
});
