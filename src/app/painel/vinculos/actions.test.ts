import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequererAcessoPainel, mockUpsert, mockUpdate, mockRevalidatePath } =
  vi.hoisted(() => ({
    mockRequererAcessoPainel: vi.fn(),
    mockUpsert: vi.fn(),
    mockUpdate: vi.fn(),
    mockRevalidatePath: vi.fn(),
  }));

vi.mock("@/lib/auth/requerer-acesso-painel", () => ({
  requererAcessoPainel: mockRequererAcessoPainel,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { vinculoParceria: { upsert: mockUpsert, update: mockUpdate } },
}));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));

import { criarVinculo, desativarVinculo, reativarVinculo } from "./actions";

function buildFormData(campos: Record<string, string>) {
  const formData = new FormData();
  for (const [chave, valor] of Object.entries(campos)) {
    formData.set(chave, valor);
  }
  return formData;
}

describe("criarVinculo", () => {
  beforeEach(() => {
    mockRequererAcessoPainel.mockReset();
    mockUpsert.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige acesso ao painel", async () => {
    mockRequererAcessoPainel.mockRejectedValue(new Error("Acesso negado"));

    await expect(
      criarVinculo(buildFormData({ clienteId: "c1", parceriaId: "p1" })),
    ).rejects.toThrow("Acesso negado");
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("rejeita sem clienteId", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });

    await expect(
      criarVinculo(buildFormData({ parceriaId: "p1" })),
    ).rejects.toThrow("Selecione a cliente");
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("rejeita sem parceriaId", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });

    await expect(
      criarVinculo(buildFormData({ clienteId: "c1" })),
    ).rejects.toThrow("Selecione a parceria");
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("cria o vínculo com criadoPorId da sessão, reativando se já existir", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockUpsert.mockResolvedValue({});

    await criarVinculo(buildFormData({ clienteId: "c1", parceriaId: "p1" }));

    expect(mockUpsert).toHaveBeenCalledWith({
      where: { clienteId_parceriaId: { clienteId: "c1", parceriaId: "p1" } },
      create: {
        clienteId: "c1",
        parceriaId: "p1",
        criadoPorId: "patty-1",
        ativo: true,
      },
      update: { ativo: true },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/vinculos");
  });
});

describe("desativarVinculo", () => {
  beforeEach(() => {
    mockRequererAcessoPainel.mockReset();
    mockUpdate.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige acesso ao painel", async () => {
    mockRequererAcessoPainel.mockRejectedValue(new Error("Acesso negado"));

    await expect(desativarVinculo("v1")).rejects.toThrow("Acesso negado");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("marca o vínculo como inativo", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockUpdate.mockResolvedValue({});

    await desativarVinculo("v1");

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "v1" },
      data: { ativo: false },
    });
  });
});

describe("reativarVinculo", () => {
  beforeEach(() => {
    mockRequererAcessoPainel.mockReset();
    mockUpdate.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("marca o vínculo como ativo", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockUpdate.mockResolvedValue({});

    await reativarVinculo("v1");

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "v1" },
      data: { ativo: true },
    });
  });
});
