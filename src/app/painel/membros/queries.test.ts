import { describe, expect, it, vi } from "vitest";
const { mockFindMany, mockCount } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockCount: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findMany: mockFindMany, count: mockCount } },
}));
import { contarAdminsGestorasAtivos, listarMembros } from "./queries";
describe("contarAdminsGestorasAtivos", () => {
  it("conta usuários ATIVO com papel ADMIN ou GESTORA", async () => {
    mockCount.mockResolvedValue(2);
    await expect(contarAdminsGestorasAtivos()).resolves.toBe(2);
    expect(mockCount).toHaveBeenCalledWith({
      where: {
        status: "ATIVO",
        papeis: { some: { papel: { in: ["ADMIN", "GESTORA"] } } },
      },
    });
  });
});
describe("listarMembros", () => {
  it("busca usuários ATIVO ou SUSPENSO ordenados por nome, incluindo papéis e contagem de vínculos ativos como parceria", async () => {
    mockFindMany.mockResolvedValue([]);
    await listarMembros();
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { status: { in: ["ATIVO", "SUSPENSO"] } },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        status: true,
        papeis: { select: { papel: true } },
        _count: {
          select: {
            vinculosComoParceria: { where: { ativo: true } },
          },
        },
      },
    });
  });
});
