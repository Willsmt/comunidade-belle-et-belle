import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockFindMany, mockGerarUrlAssinada } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockFindMany: vi.fn(),
  mockGerarUrlAssinada: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/prisma", () => ({
  prisma: { planoRecebido: { findMany: mockFindMany } },
}));
vi.mock("@/lib/storage/planos", () => ({
  gerarUrlAssinada: mockGerarUrlAssinada,
}));

import { listarPlanosRecebidos } from "./queries";

describe("listarPlanosRecebidos", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockFindMany.mockReset();
    mockGerarUrlAssinada.mockReset();
  });

  it("lança erro se não houver sessão", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(listarPlanosRecebidos()).rejects.toThrow("Sessão inválida");
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("busca só os planos da cliente logada, mais recentes primeiro, com signed URL cada um", async () => {
    mockAuth.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindMany.mockResolvedValue([
      { id: "p1", arquivoChave: "chave-1", tipo: "TREINO" },
    ]);
    mockGerarUrlAssinada.mockResolvedValue("https://url-assinada.exemplo");

    const resultado = await listarPlanosRecebidos();

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { clienteId: "cliente-1" },
      orderBy: { enviadoEm: "desc" },
      include: { parceria: { select: { id: true, name: true, email: true } } },
    });
    expect(resultado[0]?.urlAssinada).toBe("https://url-assinada.exemplo");
  });
});
