import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockFindUnique } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockFindUnique: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/prisma", () => ({
  prisma: { perfilParceria: { findUnique: mockFindUnique } },
}));

import { obterPerfilParceriaProprio } from "./queries";

describe("obterPerfilParceriaProprio", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockFindUnique.mockReset();
  });

  it("lança erro se não houver sessão", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(obterPerfilParceriaProprio()).rejects.toThrow("Sessão inválida");
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it("busca o perfil da parceria logada pelo usuarioId", async () => {
    mockAuth.mockResolvedValue({ user: { id: "parceria-1" } });
    mockFindUnique.mockResolvedValue(null);

    await obterPerfilParceriaProprio();

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { usuarioId: "parceria-1" },
    });
  });
});
