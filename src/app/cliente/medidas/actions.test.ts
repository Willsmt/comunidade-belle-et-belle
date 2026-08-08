import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequererPapel, mockCreate, mockRevalidatePath } = vi.hoisted(() => ({
  mockRequererPapel: vi.fn(),
  mockCreate: vi.fn(),
  mockRevalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth/requerer-acesso-painel", () => ({
  requererPapel: mockRequererPapel,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { registroMedida: { create: mockCreate } },
}));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));

import { criarRegistroMedida } from "./actions";

function buildFormData(campos: Record<string, string>) {
  const formData = new FormData();
  for (const [chave, valor] of Object.entries(campos)) {
    formData.set(chave, valor);
  }
  return formData;
}

describe("criarRegistroMedida", () => {
  beforeEach(() => {
    mockRequererPapel.mockReset();
    mockCreate.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige o papel CLIENTE e não cria nada se o acesso for negado", async () => {
    mockRequererPapel.mockRejectedValue(new Error("Acesso negado"));

    await expect(
      criarRegistroMedida(buildFormData({ peso: "60" })),
    ).rejects.toThrow("Acesso negado");

    expect(mockRequererPapel).toHaveBeenCalledWith(["CLIENTE"]);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejeita se nenhuma medida foi preenchida", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "cliente-1" } });

    await expect(criarRegistroMedida(buildFormData({}))).rejects.toThrow(
      "Preencha ao menos uma medida",
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("cria o registro usando o clienteId da sessão, ignorando qualquer clienteId do input", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "cliente-1" } });
    mockCreate.mockResolvedValue({});

    await criarRegistroMedida(
      buildFormData({ peso: "60.5", clienteId: "outro-usuario" }),
    );

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        clienteId: "cliente-1",
        data: undefined,
        peso: 60.5,
        cintura: undefined,
        quadril: undefined,
        braco: undefined,
        coxa: undefined,
      },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/cliente/medidas");
  });

  it("aceita todas as medidas e converte a data informada", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "cliente-1" } });
    mockCreate.mockResolvedValue({});

    await criarRegistroMedida(
      buildFormData({
        data: "2026-01-15",
        peso: "60",
        cintura: "70",
        quadril: "95",
        braco: "28",
        coxa: "55",
      }),
    );

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        clienteId: "cliente-1",
        data: new Date("2026-01-15"),
        peso: 60,
        cintura: 70,
        quadril: 95,
        braco: 28,
        coxa: 55,
      },
    });
  });
});
