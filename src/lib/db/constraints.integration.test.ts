import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { limparBanco } from "@/test-utils/db";

afterEach(async () => {
  await limparBanco();
});

describe("constraints do schema (Postgres real)", () => {
  it("impede papel duplicado pro mesmo usuário", async () => {
    const usuario = await prisma.user.create({
      data: { email: "teste-papel@example.com", status: "ATIVO" },
    });

    await prisma.usuarioPapel.create({
      data: { userId: usuario.id, papel: "CLIENTE" },
    });

    await expect(
      prisma.usuarioPapel.create({
        data: { userId: usuario.id, papel: "CLIENTE" },
      }),
    ).rejects.toThrow();
  });

  it("permite papéis diferentes pro mesmo usuário (ex: Patty como GESTORA + PARCERIA)", async () => {
    const usuario = await prisma.user.create({
      data: { email: "patty-teste@example.com", status: "ATIVO" },
    });

    await prisma.usuarioPapel.create({ data: { userId: usuario.id, papel: "GESTORA" } });
    await prisma.usuarioPapel.create({ data: { userId: usuario.id, papel: "PARCERIA" } });

    const papeis = await prisma.usuarioPapel.findMany({ where: { userId: usuario.id } });
    expect(papeis).toHaveLength(2);
  });

  it("impede mais de um consentimento pro mesmo usuário (relação 1:1)", async () => {
    const usuario = await prisma.user.create({
      data: { email: "teste-consentimento@example.com", status: "ATIVO" },
    });

    await prisma.consentimento.create({
      data: { userId: usuario.id, versaoTermo: "v1-rascunho" },
    });

    await expect(
      prisma.consentimento.create({
        data: { userId: usuario.id, versaoTermo: "v1-rascunho" },
      }),
    ).rejects.toThrow();
  });

  it("deletar o usuário remove em cascata papéis, consentimento, contas e sessões", async () => {
    const usuario = await prisma.user.create({
      data: { email: "teste-cascade@example.com", status: "ATIVO" },
    });

    await prisma.usuarioPapel.create({ data: { userId: usuario.id, papel: "CLIENTE" } });
    await prisma.consentimento.create({
      data: { userId: usuario.id, versaoTermo: "v1-rascunho" },
    });
    await prisma.account.create({
      data: {
        userId: usuario.id,
        type: "oauth",
        provider: "google",
        providerAccountId: "google-id-teste",
      },
    });
    await prisma.session.create({
      data: {
        userId: usuario.id,
        sessionToken: "token-teste",
        expires: new Date(Date.now() + 1000 * 60 * 60),
      },
    });

    await prisma.user.delete({ where: { id: usuario.id } });

    expect(await prisma.usuarioPapel.findMany({ where: { userId: usuario.id } })).toHaveLength(0);
    expect(await prisma.consentimento.findUnique({ where: { userId: usuario.id } })).toBeNull();
    expect(await prisma.account.findMany({ where: { userId: usuario.id } })).toHaveLength(0);
    expect(await prisma.session.findMany({ where: { userId: usuario.id } })).toHaveLength(0);
  });
});
