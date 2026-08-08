import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockUpsert } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockUpsert: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/prisma", () => ({
  prisma: { consentimento: { upsert: mockUpsert } },
}));

import { aceitarTermo } from "./actions";

describe("aceitarTermo", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockUpsert.mockReset();
  });

  it("lança erro se não houver sessão válida", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(aceitarTermo()).rejects.toThrow("Sessão inválida");
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("grava o consentimento pro usuário da sessão, ignorando qualquer input externo", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockUpsert.mockResolvedValue({});

    const resultado = await aceitarTermo();

    expect(mockUpsert).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      create: { userId: "user-1", versaoTermo: "v1-rascunho" },
      update: { versaoTermo: "v1-rascunho", aceitoEm: expect.any(Date) },
    });
    expect(resultado).toEqual({ ok: true });
  });
});
