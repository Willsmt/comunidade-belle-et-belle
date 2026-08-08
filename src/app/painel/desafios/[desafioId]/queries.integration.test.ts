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
});
