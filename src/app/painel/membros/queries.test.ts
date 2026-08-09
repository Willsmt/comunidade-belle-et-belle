import { describe, expect, it, vi } from "vitest";
const { mockFindMany } = vi.hoisted(() => ({ mockFindMany: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findMany: mockFindMany } },
}));
import { listarMembros } from "./queries";
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
