import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindManyTipoSessao, mockFindManyTipoPacote } = vi.hoisted(() => ({
  mockFindManyTipoSessao: vi.fn(),
  mockFindManyTipoPacote: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tipoSessao: { findMany: mockFindManyTipoSessao },
    tipoPacote: { findMany: mockFindManyTipoPacote },
  },
}));

import { listarTiposSessao, listarTiposPacote } from "./queries";

describe("listarTiposSessao", () => {
  beforeEach(() => {
    mockFindManyTipoSessao.mockReset();
  });

  it("busca tipos de sessão ordenados por nome", async () => {
    mockFindManyTipoSessao.mockResolvedValue([]);

    await listarTiposSessao();

    expect(mockFindManyTipoSessao).toHaveBeenCalledWith({
      orderBy: { nome: "asc" },
    });
  });
});

describe("listarTiposPacote", () => {
  beforeEach(() => {
    mockFindManyTipoPacote.mockReset();
  });

  it("busca tipos de pacote com a composição, mais recentes primeiro", async () => {
    mockFindManyTipoPacote.mockResolvedValue([]);

    await listarTiposPacote();

    expect(mockFindManyTipoPacote).toHaveBeenCalledWith({
      orderBy: { criadoEm: "desc" },
      include: {
        itens: {
          include: { tipoSessao: true },
        },
      },
    });
  });
});
