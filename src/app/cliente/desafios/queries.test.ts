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

  it("busca o desafio ativo com categorias/itens, desafios surpresa e as participações do próprio cliente", async () => {
    mockAuth.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindFirst.mockResolvedValue({
      id: "d1",
      categorias: [],
      dataInicio: new Date("2026-08-01T00:00:00.000Z"),
    });
    mockFindMany
      .mockResolvedValueOnce([{ itemId: "i1" }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

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
        desafiosSurpresa: {
          orderBy: { criadoEm: "desc" },
          include: {
            participacoes: {
              where: { clienteId: "cliente-1" },
            },
          },
        },
      },
    });
    expect(resultado?.itensMarcadosHoje).toEqual(new Set(["i1"]));
    expect(resultado?.rankingSemanal).toEqual([]);
    expect(resultado?.rankingGeral).toEqual([]);
    expect(resultado?.clienteId).toBe("cliente-1");
  });

  it("soma os pontos por cliente e ordena o ranking do maior pro menor", async () => {
    mockAuth.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindFirst.mockResolvedValue({
      id: "d1",
      categorias: [],
      dataInicio: new Date("2026-08-01T00:00:00.000Z"),
    });
    const marcacoesComPontos = [
      {
        clienteId: "cliente-1",
        item: { pontos: 5 },
        cliente: { id: "cliente-1", name: "Você", email: "voce@x.com" },
      },
      {
        clienteId: "cliente-2",
        item: { pontos: 10 },
        cliente: { id: "cliente-2", name: "Marina", email: "marina@x.com" },
      },
      {
        clienteId: "cliente-1",
        item: { pontos: 3 },
        cliente: { id: "cliente-1", name: "Você", email: "voce@x.com" },
      },
    ];
    mockFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(marcacoesComPontos)
      .mockResolvedValueOnce(marcacoesComPontos);

    const resultado = await obterDesafioAtivoParaCliente();

    expect(resultado?.rankingSemanal).toEqual([
      { clienteId: "cliente-2", nome: "Marina", pontos: 10 },
      { clienteId: "cliente-1", nome: "Você", pontos: 8 },
    ]);
  });
});
