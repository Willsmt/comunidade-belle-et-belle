import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockFindMany } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockFindMany: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/prisma", () => ({
  prisma: { registroMedida: { findMany: mockFindMany } },
}));

import { listarMedidas } from "./queries";

describe("listarMedidas", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockFindMany.mockReset();
  });

  it("lança erro se não houver sessão", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(listarMedidas()).rejects.toThrow("Sessão inválida");
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("busca só as medidas do usuário logado, ordenadas por data desc", async () => {
    mockAuth.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindMany.mockResolvedValue([]);

    await listarMedidas();

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { clienteId: "cliente-1" },
      orderBy: { data: "desc" },
    });
  });
});
