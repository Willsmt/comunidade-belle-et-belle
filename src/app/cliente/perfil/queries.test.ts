import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockFindUnique } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockFindUnique: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/prisma", () => ({
  prisma: { perfil: { findUnique: mockFindUnique } },
}));

import { obterPerfilProprio } from "./queries";

describe("obterPerfilProprio", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockFindUnique.mockReset();
  });

  it("lança erro se não houver sessão", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(obterPerfilProprio()).rejects.toThrow("Sessão inválida");
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it("busca o perfil do usuário logado pelo userId", async () => {
    mockAuth.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindUnique.mockResolvedValue(null);

    await obterPerfilProprio();

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { userId: "cliente-1" },
    });
  });
});
