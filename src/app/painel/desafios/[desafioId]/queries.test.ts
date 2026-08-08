import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindUnique } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { desafio: { findUnique: mockFindUnique } },
}));

import { obterDesafioComCategorias } from "./queries";

describe("obterDesafioComCategorias", () => {
  beforeEach(() => {
    mockFindUnique.mockReset();
  });

  it("busca o desafio com categorias e itens ordenados", async () => {
    mockFindUnique.mockResolvedValue(null);

    await obterDesafioComCategorias("d1");

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: "d1" },
      include: {
        categorias: {
          orderBy: { nome: "asc" },
          include: {
            itens: { orderBy: { descricao: "asc" } },
          },
        },
      },
    });
  });
});
