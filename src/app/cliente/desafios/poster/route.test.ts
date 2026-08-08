import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockDesafioFindFirst } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDesafioFindFirst: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    desafio: { findFirst: mockDesafioFindFirst },
    jornadaDesafio: { findUnique: vi.fn() },
    conquista: { findMany: vi.fn() },
  },
}));
vi.mock("@/lib/storage/jornada-desafio", () => ({
  gerarUrlAssinada: vi.fn(),
}));

import { GET } from "./route";

describe("GET /cliente/desafios/poster", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockDesafioFindFirst.mockReset();
  });

  it("retorna 401 sem sessão", async () => {
    mockAuth.mockResolvedValue(null);

    const resposta = await GET();

    expect(resposta.status).toBe(401);
    expect(mockDesafioFindFirst).not.toHaveBeenCalled();
  });

  it("retorna 404 quando não há desafio encerrado", async () => {
    mockAuth.mockResolvedValue({ user: { id: "cliente-1" } });
    mockDesafioFindFirst.mockResolvedValue(null);

    const resposta = await GET();

    expect(resposta.status).toBe(404);
  });
});
