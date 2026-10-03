import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockFindMany, mockGerarUrlAssinada } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockFindMany: vi.fn(),
  mockGerarUrlAssinada: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/prisma", () => ({
  prisma: { fotoEvolucao: { findMany: mockFindMany } },
}));
vi.mock("@/lib/storage/fotos", () => ({
  gerarUrlAssinada: mockGerarUrlAssinada,
}));

import { listarFotos } from "./queries";

describe("listarFotos", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockFindMany.mockReset();
    mockGerarUrlAssinada.mockReset();
  });

  it("lança erro se não houver sessão", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(listarFotos()).rejects.toThrow("Sessão inválida");
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("busca as fotos do usuário logado e gera signed URL pra cada uma", async () => {
    mockAuth.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindMany.mockResolvedValue([
      { id: "foto-1", chave: "chave-1", publica: false, _count: { posts: 0 } },
      { id: "foto-2", chave: "chave-2", publica: true, _count: { posts: 2 } },
    ]);
    mockGerarUrlAssinada.mockImplementation(async (chave: string) => `url-${chave}`);

    const resultado = await listarFotos();

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { clienteId: "cliente-1" },
      orderBy: { data: "desc" },
      include: { _count: { select: { posts: true } } },
    });
    expect(resultado).toEqual([
      { id: "foto-1", chave: "chave-1", publica: false, totalPosts: 0, urlAssinada: "url-chave-1" },
      { id: "foto-2", chave: "chave-2", publica: true, totalPosts: 2, urlAssinada: "url-chave-2" },
    ]);
  });
});
