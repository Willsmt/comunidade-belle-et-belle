import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { limparBanco } from "@/test-utils/db";
import { listarMembros } from "./queries";

afterEach(async () => {
  await limparBanco();
});

describe("listarMembros (Postgres real)", () => {
  it("retorna ATIVO e SUSPENSO, mas não PENDENTE", async () => {
    await prisma.user.create({
      data: { email: "pendente@example.com", status: "PENDENTE", name: "Pendente" },
    });
    const ativa = await prisma.user.create({
      data: { email: "ativa@example.com", status: "ATIVO", name: "Ativa" },
    });
    const suspensa = await prisma.user.create({
      data: { email: "suspensa@example.com", status: "SUSPENSO", name: "Suspensa" },
    });

    const resultado = await listarMembros();
    const ids = resultado.map((m) => m.id).sort();

    expect(ids).toEqual([ativa.id, suspensa.id].sort());
  });
});
