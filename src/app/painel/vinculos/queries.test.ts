import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindManyVinculo, mockFindManyUser } = vi.hoisted(() => ({
  mockFindManyVinculo: vi.fn(),
  mockFindManyUser: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    vinculoParceria: { findMany: mockFindManyVinculo },
    user: { findMany: mockFindManyUser },
  },
}));

import { listarVinculos, listarClientesEParcerias } from "./queries";

describe("listarVinculos", () => {
  beforeEach(() => {
    mockFindManyVinculo.mockReset();
  });

  it("busca vínculos com cliente e parceria incluídos, mais recentes primeiro", async () => {
    mockFindManyVinculo.mockResolvedValue([]);

    await listarVinculos();

    expect(mockFindManyVinculo).toHaveBeenCalledWith({
      orderBy: { criadoEm: "desc" },
      include: {
        cliente: { select: { id: true, name: true, email: true } },
        parceria: { select: { id: true, name: true, email: true } },
      },
    });
  });
});

describe("listarClientesEParcerias", () => {
  beforeEach(() => {
    mockFindManyUser.mockReset();
  });

  it("busca clientes e parcerias ativas separadamente, filtrando por papel", async () => {
    mockFindManyUser.mockResolvedValue([]);

    await listarClientesEParcerias();

    expect(mockFindManyUser).toHaveBeenCalledWith({
      where: { status: "ATIVO", papeis: { some: { papel: "CLIENTE" } } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    });
    expect(mockFindManyUser).toHaveBeenCalledWith({
      where: { status: "ATIVO", papeis: { some: { papel: "PARCERIA" } } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    });
  });
});
