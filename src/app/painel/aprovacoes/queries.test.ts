import { describe, expect, it, vi } from "vitest";

const { mockFindMany } = vi.hoisted(() => ({ mockFindMany: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findMany: mockFindMany } },
}));

import { listarPendentes } from "./queries";

describe("listarPendentes", () => {
  it("busca usuários PENDENTE ordenados por criadoEm ascendente", async () => {
    mockFindMany.mockResolvedValue([]);
    await listarPendentes();

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { status: "PENDENTE" },
      orderBy: { criadoEm: "asc" },
      select: { id: true, name: true, email: true, image: true, criadoEm: true },
    });
  });
});
