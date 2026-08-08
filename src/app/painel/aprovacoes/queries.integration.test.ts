import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { limparBanco } from "@/test-utils/db";
import { listarPendentes } from "./queries";

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
