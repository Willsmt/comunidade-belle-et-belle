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

  it("retorna os papéis acumulados de cada membro", async () => {
    const parceria = await prisma.user.create({
      data: { email: "parceria@example.com", status: "ATIVO", name: "Parceria" },
    });
    await prisma.usuarioPapel.create({
      data: { userId: parceria.id, papel: "PARCERIA" },
    });

    const resultado = await listarMembros();

    const encontrada = resultado.find((m) => m.id === parceria.id);
    expect(encontrada?.papeis).toEqual([{ papel: "PARCERIA" }]);
  });
});
