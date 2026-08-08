import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockFindFirst, mockFindMany } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockFindFirst: vi.fn(),
  mockFindMany: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: mockAuth,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    desafio: { findFirst: mockFindFirst },
    marcacaoItem: { findMany: mockFindMany },
  },
}));

import { obterDesafioAtivoParaCliente } from "./queries";

describe("obterDesafioAtivoParaCliente", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockFindFirst.mockReset();
    mockFindMany.mockReset();
  });

  it("exige sessão válida", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(obterDesafioAtivoParaCliente()).rejects.toThrow("Sessão inválida");
    expect(mockFindFirst).not.toHaveBeenCalled();
  });

  it("retorna null quando não há desafio ativo", async () => {
    mockAuth.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindFirst.mockResolvedValue(null);

    const resultado = await obterDesafioAtivoParaCliente();

    expect(resultado).toBeNull();
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("busca o desafio ativo com categorias e itens, e as marcações de hoje do cliente", async () => {
    mockAuth.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindFirst.mockResolvedValue({ id: "d1", categorias: [] });
    mockFindMany.mockResolvedValue([{ itemId: "i1" }, { itemId: "i2" }]);

    const resultado = await obterDesafioAtivoParaCliente();

    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { ativo: true },
      include: {
        categorias: {
          orderBy: { nome: "asc" },
          include: {
            itens: { orderBy: { descricao: "asc" } },
          },
        },
      },
    });
    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        clienteId: "cliente-1",
        data: expect.any(Date),
        item: { categoria: { desafioId: "d1" } },
      },
      select: { itemId: true },
    });
    expect(resultado?.itensMarcadosHoje).toEqual(new Set(["i1", "i2"]));
  });
});
