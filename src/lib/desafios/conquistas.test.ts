import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRegraFindMany,
  mockConquistaFindFirst,
  mockConquistaCreate,
  mockMarcacaoCount,
  mockItemCount,
  mockDesafioFindUniqueOrThrow,
} = vi.hoisted(() => ({
  mockRegraFindMany: vi.fn(),
  mockConquistaFindFirst: vi.fn(),
  mockConquistaCreate: vi.fn(),
  mockMarcacaoCount: vi.fn(),
  mockItemCount: vi.fn(),
  mockDesafioFindUniqueOrThrow: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    regraBonus: { findMany: mockRegraFindMany },
    conquista: { findFirst: mockConquistaFindFirst, create: mockConquistaCreate },
    marcacaoItem: { count: mockMarcacaoCount, findMany: vi.fn() },
    itemDesafio: { count: mockItemCount },
    desafio: { findUniqueOrThrow: mockDesafioFindUniqueOrThrow },
  },
}));

import {
  verificarConquistasBonus,
  verificarConquistasRankingSemanal,
  verificarConquistaRankingGeral,
} from "./conquistas";

describe("verificarConquistasBonus", () => {
  beforeEach(() => {
    mockRegraFindMany.mockReset();
    mockConquistaFindFirst.mockReset();
    mockConquistaCreate.mockReset();
    mockMarcacaoCount.mockReset();
    mockItemCount.mockReset();
  });

  it("não cria conquista se a regra já foi conquistada antes", async () => {
    mockRegraFindMany.mockResolvedValue([
      {
        id: "r1",
        desafioId: "d1",
        tipo: "LIMIAR_DIARIO",
        limiarItens: 3,
        categoriaId: null,
        emblemaId: "e1",
        itensCombo: [],
      },
    ]);
    mockConquistaFindFirst.mockResolvedValue({ id: "c1" });

    await verificarConquistasBonus("cliente-1", "d1", new Date("2026-09-05"));

    expect(mockConquistaCreate).not.toHaveBeenCalled();
  });

  it("cria conquista de LIMIAR_DIARIO quando a quantidade marcada hoje bate o limiar", async () => {
    mockRegraFindMany.mockResolvedValue([
      {
        id: "r1",
        desafioId: "d1",
        tipo: "LIMIAR_DIARIO",
        limiarItens: 3,
        categoriaId: null,
        emblemaId: "e1",
        itensCombo: [],
      },
    ]);
    mockConquistaFindFirst.mockResolvedValue(null);
    mockMarcacaoCount.mockResolvedValue(3);

    await verificarConquistasBonus("cliente-1", "d1", new Date("2026-09-05"));

    expect(mockConquistaCreate).toHaveBeenCalledWith({
      data: {
        clienteId: "cliente-1",
        desafioId: "d1",
        emblemaId: "e1",
        tipo: "BONUS",
        referencia: "r1",
      },
    });
  });

  it("não cria conquista de LIMIAR_DIARIO quando a quantidade fica abaixo do limiar", async () => {
    mockRegraFindMany.mockResolvedValue([
      {
        id: "r1",
        desafioId: "d1",
        tipo: "LIMIAR_DIARIO",
        limiarItens: 3,
        categoriaId: null,
        emblemaId: "e1",
        itensCombo: [],
      },
    ]);
    mockConquistaFindFirst.mockResolvedValue(null);
    mockMarcacaoCount.mockResolvedValue(2);

    await verificarConquistasBonus("cliente-1", "d1", new Date("2026-09-05"));

    expect(mockConquistaCreate).not.toHaveBeenCalled();
  });

  it("cria conquista de COMBO quando todos os itens do combo estão marcados", async () => {
    mockRegraFindMany.mockResolvedValue([
      {
        id: "r2",
        desafioId: "d1",
        tipo: "COMBO",
        limiarItens: null,
        categoriaId: null,
        emblemaId: "e2",
        itensCombo: [{ id: "i1" }, { id: "i2" }],
      },
    ]);
    mockConquistaFindFirst.mockResolvedValue(null);
    mockMarcacaoCount.mockResolvedValue(2);

    await verificarConquistasBonus("cliente-1", "d1", new Date("2026-09-05"));

    expect(mockConquistaCreate).toHaveBeenCalledWith({
      data: {
        clienteId: "cliente-1",
        desafioId: "d1",
        emblemaId: "e2",
        tipo: "BONUS",
        referencia: "r2",
      },
    });
  });

  it("não cria conquista de COMBO quando só parte dos itens está marcada", async () => {
    mockRegraFindMany.mockResolvedValue([
      {
        id: "r2",
        desafioId: "d1",
        tipo: "COMBO",
        limiarItens: null,
        categoriaId: null,
        emblemaId: "e2",
        itensCombo: [{ id: "i1" }, { id: "i2" }],
      },
    ]);
    mockConquistaFindFirst.mockResolvedValue(null);
    mockMarcacaoCount.mockResolvedValue(1);

    await verificarConquistasBonus("cliente-1", "d1", new Date("2026-09-05"));

    expect(mockConquistaCreate).not.toHaveBeenCalled();
  });

  it("cria conquista de CATEGORIA_COMPLETA quando todos os itens da categoria estão marcados", async () => {
    mockRegraFindMany.mockResolvedValue([
      {
        id: "r3",
        desafioId: "d1",
        tipo: "CATEGORIA_COMPLETA",
        limiarItens: null,
        categoriaId: "cat1",
        emblemaId: "e3",
        itensCombo: [],
      },
    ]);
    mockConquistaFindFirst.mockResolvedValue(null);
    mockItemCount.mockResolvedValue(4);
    mockMarcacaoCount.mockResolvedValue(4);

    await verificarConquistasBonus("cliente-1", "d1", new Date("2026-09-05"));

    expect(mockConquistaCreate).toHaveBeenCalledWith({
      data: {
        clienteId: "cliente-1",
        desafioId: "d1",
        emblemaId: "e3",
        tipo: "BONUS",
        referencia: "r3",
      },
    });
  });

  it("não cria conquista de CATEGORIA_COMPLETA quando falta item marcar", async () => {
    mockRegraFindMany.mockResolvedValue([
      {
        id: "r3",
        desafioId: "d1",
        tipo: "CATEGORIA_COMPLETA",
        limiarItens: null,
        categoriaId: "cat1",
        emblemaId: "e3",
        itensCombo: [],
      },
    ]);
    mockConquistaFindFirst.mockResolvedValue(null);
    mockItemCount.mockResolvedValue(4);
    mockMarcacaoCount.mockResolvedValue(3);

    await verificarConquistasBonus("cliente-1", "d1", new Date("2026-09-05"));

    expect(mockConquistaCreate).not.toHaveBeenCalled();
  });
});

describe("verificarConquistasRankingSemanal", () => {
  beforeEach(() => {
    mockDesafioFindUniqueOrThrow.mockReset();
    mockConquistaFindFirst.mockReset();
    mockConquistaCreate.mockReset();
  });

  it("não faz nada se o desafio não tem emblema de ranking semanal configurado", async () => {
    mockDesafioFindUniqueOrThrow.mockResolvedValue({
      id: "d1",
      dataInicio: new Date("2026-09-01"),
      emblemaRankingSemanalId: null,
    });

    await verificarConquistasRankingSemanal("d1", new Date("2026-09-15"));

    expect(mockConquistaCreate).not.toHaveBeenCalled();
  });
});

describe("verificarConquistaRankingGeral", () => {
  beforeEach(() => {
    mockDesafioFindUniqueOrThrow.mockReset();
    mockConquistaFindFirst.mockReset();
    mockConquistaCreate.mockReset();
  });

  it("não faz nada se o desafio não tem emblema de ranking geral configurado", async () => {
    mockDesafioFindUniqueOrThrow.mockResolvedValue({
      id: "d1",
      emblemaRankingGeralId: null,
    });

    await verificarConquistaRankingGeral("d1");

    expect(mockConquistaCreate).not.toHaveBeenCalled();
  });

  it("não cria conquista se já foi premiada antes", async () => {
    mockDesafioFindUniqueOrThrow.mockResolvedValue({
      id: "d1",
      emblemaRankingGeralId: "e1",
    });
    mockConquistaFindFirst.mockResolvedValue({ id: "c1" });

    await verificarConquistaRankingGeral("d1");

    expect(mockConquistaCreate).not.toHaveBeenCalled();
  });
});
