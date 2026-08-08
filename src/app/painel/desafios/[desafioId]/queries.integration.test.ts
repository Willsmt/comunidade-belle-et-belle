import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { limparBanco } from "@/test-utils/db";
import { obterDesafioComCategorias } from "./queries";

afterEach(async () => {
  await limparBanco();
});

describe("obterDesafioComCategorias (Postgres real)", () => {
  it("retorna categorias e itens ordenados por nome/descrição", async () => {
    const desafio = await prisma.desafio.create({
      data: {
        titulo: "Glow Up",
        dataInicio: new Date("2026-09-01"),
        dataFim: new Date("2026-09-30"),
      },
    });
    await prisma.categoriaDesafio.create({
      data: { desafioId: desafio.id, nome: "Zelo", cor: "#000" },
    });
    const categoriaA = await prisma.categoriaDesafio.create({
      data: { desafioId: desafio.id, nome: "Ativa", cor: "#111" },
    });
    await prisma.itemDesafio.create({
      data: { categoriaId: categoriaA.id, descricao: "Zebra", pontos: 3 },
    });
    await prisma.itemDesafio.create({
      data: { categoriaId: categoriaA.id, descricao: "Água", pontos: 5 },
    });

    const resultado = await obterDesafioComCategorias(desafio.id);

    expect(resultado?.categorias.map((c) => c.nome)).toEqual(["Ativa", "Zelo"]);
    expect(resultado?.categorias[0]?.itens.map((i) => i.descricao)).toEqual([
      "Água",
      "Zebra",
    ]);
  });

  it("retorna null quando o desafio não existe", async () => {
    const resultado = await obterDesafioComCategorias("id-inexistente");

    expect(resultado).toBeNull();
  });

  it("retorna regras de bônus com os itens do combo incluídos", async () => {
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
    const item1 = await prisma.itemDesafio.create({
      data: { categoriaId: categoria.id, descricao: "Água", pontos: 5 },
    });
    const item2 = await prisma.itemDesafio.create({
      data: { categoriaId: categoria.id, descricao: "Academia", pontos: 10 },
    });
    await prisma.regraBonus.create({
      data: {
        desafioId: desafio.id,
        tipo: "COMBO",
        pontosExtras: 15,
        itensCombo: { connect: [{ id: item1.id }, { id: item2.id }] },
      },
    });

    const resultado = await obterDesafioComCategorias(desafio.id);

    expect(resultado?.regrasBonus).toHaveLength(1);
    expect(
      resultado?.regrasBonus[0]?.itensCombo.map((i) => i.descricao).sort(),
    ).toEqual(["Academia", "Água"]);
  });
});

describe("obterDesafioComCategorias — desafios surpresa (Postgres real)", () => {
  it("retorna desafios surpresa com as participações e o cliente de cada uma", async () => {
    const desafio = await prisma.desafio.create({
      data: {
        titulo: "Glow Up",
        dataInicio: new Date("2026-09-01"),
        dataFim: new Date("2026-09-30"),
      },
    });
    const cliente = await prisma.user.create({
      data: { email: "cliente@x.com", status: "ATIVO", name: "Cliente X" },
    });
    const surpresa = await prisma.desafioSurpresa.create({
      data: {
        desafioId: desafio.id,
        titulo: "Corrida 5km",
        pontos: 50,
        exigeComprovacao: true,
      },
    });
    await prisma.participacaoSurpresa.create({
      data: { desafioSurpresaId: surpresa.id, clienteId: cliente.id },
    });

    const resultado = await obterDesafioComCategorias(desafio.id);

    expect(resultado?.desafiosSurpresa).toHaveLength(1);
    expect(resultado?.desafiosSurpresa[0]?.participacoes).toHaveLength(1);
    expect(resultado?.desafiosSurpresa[0]?.participacoes[0]?.cliente.name).toBe("Cliente X");
  });
});
