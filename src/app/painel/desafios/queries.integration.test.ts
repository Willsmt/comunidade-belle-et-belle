import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { limparBanco } from "@/test-utils/db";
import { listarDesafios } from "./queries";

afterEach(async () => {
  await limparBanco();
});

describe("listarDesafios (Postgres real)", () => {
  it("lista desafios com a contagem de categorias, mais recentes primeiro", async () => {
    const antigo = await prisma.desafio.create({
      data: {
        titulo: "Edição 1",
        dataInicio: new Date("2026-01-01"),
        dataFim: new Date("2026-01-30"),
        ativo: false,
      },
    });
    const recente = await prisma.desafio.create({
      data: {
        titulo: "Edição 2",
        dataInicio: new Date("2026-09-01"),
        dataFim: new Date("2026-09-30"),
        ativo: true,
      },
    });
    const categoria = await prisma.categoriaDesafio.create({
      data: { desafioId: recente.id, nome: "Pele", cor: "#f5c" },
    });
    await prisma.itemDesafio.create({
      data: { categoriaId: categoria.id, descricao: "Hidratar", pontos: 5 },
    });

    const resultado = await listarDesafios();

    expect(resultado.map((d) => d.id)).toEqual([recente.id, antigo.id]);
    expect(resultado[0]?._count.categorias).toBe(1);
    expect(resultado[1]?._count.categorias).toBe(0);
  });
});
