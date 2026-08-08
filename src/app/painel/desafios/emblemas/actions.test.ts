import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequererAcessoPainel, mockCreate, mockDelete, mockRevalidatePath } = vi.hoisted(() => ({
  mockRequererAcessoPainel: vi.fn(),
  mockCreate: vi.fn(),
  mockDelete: vi.fn(),
  mockRevalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth/requerer-acesso-painel", () => ({
  requererAcessoPainel: mockRequererAcessoPainel,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { emblema: { create: mockCreate, delete: mockDelete } },
}));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));

import { criarEmblema, removerEmblema } from "./actions";

function buildFormData(campos: Record<string, string>) {
  const formData = new FormData();
  for (const [chave, valor] of Object.entries(campos)) {
    formData.set(chave, valor);
  }
  return formData;
}

describe("criarEmblema", () => {
  beforeEach(() => {
    mockRequererAcessoPainel.mockReset();
    mockCreate.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige acesso ao painel", async () => {
    mockRequererAcessoPainel.mockRejectedValue(new Error("Acesso negado"));

    await expect(
      criarEmblema(buildFormData({ nome: "Campeã da Semana" })),
    ).rejects.toThrow("Acesso negado");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejeita sem nome", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });

    await expect(criarEmblema(buildFormData({}))).rejects.toThrow(
      "Informe o nome do emblema",
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("cria o emblema com ícone e descrição nulos se não informados", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockCreate.mockResolvedValue({});

    await criarEmblema(buildFormData({ nome: "Campeã da Semana" }));

    expect(mockCreate).toHaveBeenCalledWith({
      data: { nome: "Campeã da Semana", descricao: null, icone: null },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/desafios/emblemas");
  });

  it("cria o emblema com ícone e descrição informados", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockCreate.mockResolvedValue({});

    await criarEmblema(
      buildFormData({ nome: "Campeã da Semana", icone: "🏆", descricao: "Venceu o ranking semanal" }),
    );

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        nome: "Campeã da Semana",
        descricao: "Venceu o ranking semanal",
        icone: "🏆",
      },
    });
  });
});

describe("removerEmblema", () => {
  beforeEach(() => {
    mockRequererAcessoPainel.mockReset();
    mockDelete.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige acesso ao painel", async () => {
    mockRequererAcessoPainel.mockRejectedValue(new Error("Acesso negado"));

    await expect(removerEmblema("e1")).rejects.toThrow("Acesso negado");
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("remove o emblema", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockDelete.mockResolvedValue({});

    await removerEmblema("e1");

    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "e1" } });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/desafios/emblemas");
  });
});
