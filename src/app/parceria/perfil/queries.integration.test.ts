import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { limparBanco } from "@/test-utils/db";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
vi.mock("@/auth", () => ({ auth: mockAuth }));

import { obterPerfilParceriaProprio } from "./queries";

afterEach(async () => {
  await limparBanco();
});

describe("obterPerfilParceriaProprio (Postgres real)", () => {
  it("retorna null quando a parceria ainda não criou o perfil", async () => {
    const parceria = await prisma.user.create({
      data: { email: "parceria@x.com", status: "ATIVO", name: "Parceria X" },
    });

    mockAuth.mockResolvedValue({ user: { id: parceria.id } });

    const resultado = await obterPerfilParceriaProprio();

    expect(resultado).toBeNull();
  });

  it("retorna só o perfil da própria parceria logada, nunca o de outra", async () => {
    const parceria = await prisma.user.create({
      data: { email: "parceria2@x.com", status: "ATIVO", name: "Parceria 2" },
    });
    const outraParceria = await prisma.user.create({
      data: { email: "outra-parceria@x.com", status: "ATIVO", name: "Outra Parceria" },
    });
    await prisma.perfilParceria.create({
      data: { usuarioId: parceria.id, especialidade: "Nutrição", bio: "minha bio" },
    });
    await prisma.perfilParceria.create({
      data: { usuarioId: outraParceria.id, especialidade: "Personal", bio: "bio da outra" },
    });

    mockAuth.mockResolvedValue({ user: { id: parceria.id } });

    const resultado = await obterPerfilParceriaProprio();

    expect(resultado?.bio).toBe("minha bio");
    expect(resultado?.especialidade).toBe("Nutrição");
  });
});
