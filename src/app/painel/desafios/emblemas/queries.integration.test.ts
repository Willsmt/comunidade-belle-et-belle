import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { limparBanco } from "@/test-utils/db";
import { listarEmblemas } from "./queries";

afterEach(async () => {
  await limparBanco();
});

describe("listarEmblemas (Postgres real)", () => {
  it("lista emblemas ordenados por nome", async () => {
    await prisma.emblema.create({ data: { nome: "Zelo" } });
    await prisma.emblema.create({ data: { nome: "Ativa" } });

    const resultado = await listarEmblemas();

    expect(resultado.map((e) => e.nome)).toEqual(["Ativa", "Zelo"]);
  });
});
