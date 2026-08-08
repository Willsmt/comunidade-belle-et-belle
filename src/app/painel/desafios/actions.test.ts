import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRequererAcessoPainel,
  mockFindFirst,
  mockCreate,
  mockUpdate,
  mockVerificarConquistaRankingGeral,
  mockVerificarConquistasRankingSemanal,
  mockRevalidatePath,
} = vi.hoisted(() => ({
  mockRequererAcessoPainel: vi.fn(),
  mockFindFirst: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockVerificarConquistaRankingGeral: vi.fn(),
  mockVerificarConquistasRankingSemanal: vi.fn(),
  mockRevalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth/requerer-acesso-painel", () => ({
  requererAcessoPainel: mockRequererAcessoPainel,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { desafio: { findFirst: mockFindFirst, create: mockCreate, update: mockUpdate } },
}));
vi.mock("@/lib/desafios/conquistas", () => ({
  verificarConquistaRankingGeral: mockVerificarConquistaRankingGeral,
  verificarConquistasRankingSemanal: mockVerificarConquistasRankingSemanal,
}));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));

import { criarDesafio, encerrarDesafio, reabrirDesafio } from "./actions";

function buildFormData(campos: Record<string, string>) {
  const formData = new FormData();
  for (const [chave, valor] of Object.entries(campos)) {
    formData.set(chave, valor);
  }
  return formData;
}

describe("criarDesafio", () => {
  beforeEach(() => {
    mockRequererAcessoPainel.mockReset();
    mockFindFirst.mockReset();
    mockCreate.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige acesso ao painel", async () => {
    mockRequererAcessoPainel.mockRejectedValue(new Error("Acesso negado"));

    await expect(
      criarDesafio(
        buildFormData({ titulo: "Glow Up", dataInicio: "2026-09-01", dataFim: "2026-09-30" }),
      ),
    ).rejects.toThrow("Acesso negado");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejeita sem título", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });

    await expect(
      criarDesafio(buildFormData({ dataInicio: "2026-09-01", dataFim: "2026-09-30" })),
    ).rejects.toThrow("Informe o título do desafio");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejeita sem data de início", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });

    await expect(
      criarDesafio(buildFormData({ titulo: "Glow Up", dataFim: "2026-09-30" })),
    ).rejects.toThrow("Informe a data de início");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejeita sem data de fim", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });

    await expect(
      criarDesafio(buildFormData({ titulo: "Glow Up", dataInicio: "2026-09-01" })),
    ).rejects.toThrow("Informe a data de fim");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejeita se já existir um desafio ativo", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockFindFirst.mockResolvedValue({ id: "d1", titulo: "Edição anterior" });

    await expect(
      criarDesafio(
        buildFormData({ titulo: "Glow Up", dataInicio: "2026-09-01", dataFim: "2026-09-30" }),
      ),
    ).rejects.toThrow("Já existe um desafio ativo (Edição anterior)");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("cria o desafio com os campos informados", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockFindFirst.mockResolvedValue(null);
    mockCreate.mockResolvedValue({});

    await criarDesafio(
      buildFormData({
        titulo: "Glow Up",
        fraseMotivacional: "Você é capaz",
        dataInicio: "2026-09-01",
        dataFim: "2026-09-30",
      }),
    );

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        titulo: "Glow Up",
        fraseMotivacional: "Você é capaz",
        dataInicio: new Date("2026-09-01"),
        dataFim: new Date("2026-09-30"),
        ativo: true,
      },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/desafios");
  });

  it("cria o desafio com fraseMotivacional nula se não informada", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockFindFirst.mockResolvedValue(null);
    mockCreate.mockResolvedValue({});

    await criarDesafio(
      buildFormData({ titulo: "Glow Up", dataInicio: "2026-09-01", dataFim: "2026-09-30" }),
    );

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        titulo: "Glow Up",
        fraseMotivacional: null,
        dataInicio: new Date("2026-09-01"),
        dataFim: new Date("2026-09-30"),
        ativo: true,
      },
    });
  });
});

describe("encerrarDesafio", () => {
  beforeEach(() => {
    mockRequererAcessoPainel.mockReset();
    mockUpdate.mockReset();
    mockVerificarConquistaRankingGeral.mockReset();
    mockVerificarConquistasRankingSemanal.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige acesso ao painel", async () => {
    mockRequererAcessoPainel.mockRejectedValue(new Error("Acesso negado"));

    await expect(encerrarDesafio("d1")).rejects.toThrow("Acesso negado");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("marca o desafio como inativo e verifica as conquistas de ranking semanal e geral", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockUpdate.mockResolvedValue({});

    await encerrarDesafio("d1");

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "d1" },
      data: { ativo: false },
    });
    expect(mockVerificarConquistasRankingSemanal).toHaveBeenCalledWith("d1");
    expect(mockVerificarConquistaRankingGeral).toHaveBeenCalledWith("d1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/desafios");
  });
});

describe("reabrirDesafio", () => {
  beforeEach(() => {
    mockRequererAcessoPainel.mockReset();
    mockFindFirst.mockReset();
    mockUpdate.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige acesso ao painel", async () => {
    mockRequererAcessoPainel.mockRejectedValue(new Error("Acesso negado"));

    await expect(reabrirDesafio("d1")).rejects.toThrow("Acesso negado");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejeita se já existir outro desafio ativo", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockFindFirst.mockResolvedValue({ id: "d2", titulo: "Outra edição" });

    await expect(reabrirDesafio("d1")).rejects.toThrow("Já existe um desafio ativo (Outra edição)");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("permite reabrir se o ativo encontrado for o próprio desafio", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockFindFirst.mockResolvedValue({ id: "d1", titulo: "Este mesmo" });
    mockUpdate.mockResolvedValue({});

    await reabrirDesafio("d1");

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "d1" },
      data: { ativo: true },
    });
  });

  it("marca o desafio como ativo quando não há nenhum outro ativo", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockFindFirst.mockResolvedValue(null);
    mockUpdate.mockResolvedValue({});

    await reabrirDesafio("d1");

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "d1" },
      data: { ativo: true },
    });
  });
});
