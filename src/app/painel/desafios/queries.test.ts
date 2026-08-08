import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindManyDesafio } = vi.hoisted(() => ({
  mockFindManyDesafio: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { desafio: { findMany: mockFindManyDesafio } },
}));

import { listarDesafios } from "./queries";

describe("listarDesafios", () => {
  beforeEach(() => {
    mockFindManyDesafio.mockReset();
  });

  it("busca desafios com contagem de categorias, mais recentes primeiro", async () => {
    mockFindManyDesafio.mockResolvedValue([]);

    await listarDesafios();

    expect(mockFindManyDesafio).toHaveBeenCalledWith({
      orderBy: { dataInicio: "desc" },
      include: {
        _count: { select: { categorias: true } },
      },
    });
  });
});
