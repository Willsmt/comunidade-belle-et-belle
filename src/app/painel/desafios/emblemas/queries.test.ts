import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindMany } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { emblema: { findMany: mockFindMany } },
}));

import { listarEmblemas } from "./queries";

describe("listarEmblemas", () => {
  beforeEach(() => {
    mockFindMany.mockReset();
  });

  it("busca emblemas ordenados por nome", async () => {
    mockFindMany.mockResolvedValue([]);

    await listarEmblemas();

    expect(mockFindMany).toHaveBeenCalledWith({
      orderBy: { nome: "asc" },
    });
  });
});
