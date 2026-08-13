import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindUnique, mockGerarUrlAssinada } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockGerarUrlAssinada: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { desafio: { findUnique: mockFindUnique } },
}));
vi.mock("@/lib/storage/comprovantes-surpresa", () => ({
  gerarUrlAssinada: mockGerarUrlAssinada,
}));

import { obterDesafioComCategorias } from "./queries";

describe("obterDesafioComCategorias", () => {
  beforeEach(() => {
    mockFindUnique.mockReset();
    mockGerarUrlAssinada.mockReset();
  });

  it("busca o desafio com categorias, itens, regras de bônus e desafios surpresa", async () => {
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
        regrasBonus: {
          orderBy: { criadoEm: "asc" },
          include: {
            itensCombo: true,
          },
        },
        desafiosSurpresa: {
          orderBy: { criadoEm: "desc" },
          include: {
            participacoes: {
              orderBy: { criadoEm: "asc" },
              include: {
                cliente: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
      },
    });
  });

  it("retorna null quando o desafio não existe, sem tentar gerar URL nenhuma", async () => {
    mockFindUnique.mockResolvedValue(null);

    const resultado = await obterDesafioComCategorias("d1");

    expect(resultado).toBeNull();
    expect(mockGerarUrlAssinada).not.toHaveBeenCalled();
  });

  it("gera a URL assinada da foto de comprovação de cada participação que tem fotoChave", async () => {
    mockFindUnique.mockResolvedValue({
      id: "d1",
      categorias: [],
      regrasBonus: [],
      desafiosSurpresa: [
        {
          id: "s1",
          participacoes: [
            { id: "p1", fotoChave: "comprovantes-surpresa/cliente-1/foto.webp" },
            { id: "p2", fotoChave: null },
          ],
        },
      ],
    });
    mockGerarUrlAssinada.mockResolvedValue("https://url-assinada.exemplo/foto.webp");

    const resultado = await obterDesafioComCategorias("d1");

    expect(mockGerarUrlAssinada).toHaveBeenCalledTimes(1);
    expect(mockGerarUrlAssinada).toHaveBeenCalledWith(
      "comprovantes-surpresa/cliente-1/foto.webp",
    );
    expect(resultado?.desafiosSurpresa[0]?.participacoes).toEqual([
      {
        id: "p1",
        fotoChave: "comprovantes-surpresa/cliente-1/foto.webp",
        fotoUrl: "https://url-assinada.exemplo/foto.webp",
      },
      { id: "p2", fotoChave: null, fotoUrl: null },
    ]);
  });
});
