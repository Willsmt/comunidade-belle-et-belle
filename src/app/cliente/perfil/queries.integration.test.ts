import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { limparBanco } from "@/test-utils/db";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
vi.mock("@/auth", () => ({ auth: mockAuth }));

import { obterPerfilProprio } from "./queries";

afterEach(async () => {
  await limparBanco();
});

describe("obterPerfilProprio (Postgres real)", () => {
  it("retorna null quando a cliente ainda não criou o perfil", async () => {
    const cliente = await prisma.user.create({
      data: { email: "cliente@x.com", status: "ATIVO", name: "Cliente X" },
    });

    mockAuth.mockResolvedValue({ user: { id: cliente.id } });

    const resultado = await obterPerfilProprio();

    expect(resultado).toBeNull();
  });

  it("retorna só o perfil do próprio usuário logado, nunca o de outra cliente", async () => {
    const cliente = await prisma.user.create({
      data: { email: "cliente2@x.com", status: "ATIVO", name: "Cliente 2" },
    });
    const outraCliente = await prisma.user.create({
      data: { email: "outra@x.com", status: "ATIVO", name: "Outra Cliente" },
    });
    await prisma.perfil.create({
      data: { userId: cliente.id, bio: "minha bio" },
    });
    await prisma.perfil.create({
      data: { userId: outraCliente.id, bio: "bio da outra" },
    });

    mockAuth.mockResolvedValue({ user: { id: cliente.id } });

    const resultado = await obterPerfilProprio();

    expect(resultado?.bio).toBe("minha bio");
  });
});
