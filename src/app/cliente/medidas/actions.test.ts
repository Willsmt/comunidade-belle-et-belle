import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/actions/executar-action";

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

const TODOS_OS_CAMPOS_UNDEFINED = {
  peso: undefined,
  altura: undefined,
  ombro: undefined,
  peitoBusto: undefined,
  cintura: undefined,
  abdomen: undefined,
  quadril: undefined,
  bracoDireito: undefined,
  bracoEsquerdo: undefined,
  antebracoDireito: undefined,
  antebracoEsquerdo: undefined,
  punhoDireito: undefined,
  punhoEsquerdo: undefined,
  coxaDireita: undefined,
  coxaEsquerda: undefined,
  joelhoDireito: undefined,
  joelhoEsquerdo: undefined,
  panturrilhaDireita: undefined,
  panturrilhaEsquerda: undefined,
  tornozeloDireito: undefined,
  tornozeloEsquerdo: undefined,
};

describe("criarRegistroMedida", () => {
  beforeEach(() => {
    mockRequererPapel.mockReset();
    mockCreate.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige o papel CLIENTE e não cria nada se o acesso for negado", async () => {
    mockRequererPapel.mockRejectedValue(new AppError("Acesso negado"));

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

  it("aceita quando só um dos 20 campos vem preenchido (ex.: só punho esquerdo)", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "cliente-1" } });
    mockCreate.mockResolvedValue({});

    await criarRegistroMedida(buildFormData({ punhoEsquerdo: "15.5" }));

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        clienteId: "cliente-1",
        data: undefined,
        ...TODOS_OS_CAMPOS_UNDEFINED,
        punhoEsquerdo: 15.5,
      },
    });
  });

  it("cria o registro usando o clienteId da sessão, ignorando qualquer clienteId do input, e não escreve em braco/coxa", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "cliente-1" } });
    mockCreate.mockResolvedValue({});

    await criarRegistroMedida(
      buildFormData({ peso: "60.5", clienteId: "outro-usuario" }),
    );

    const chamada = mockCreate.mock.calls[0][0];
    expect(chamada.data.clienteId).toBe("cliente-1");
    expect(chamada.data.peso).toBe(60.5);
    expect(chamada.data).not.toHaveProperty("braco");
    expect(chamada.data).not.toHaveProperty("coxa");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/cliente/medidas");
  });

  it("aceita peso, altura, as cinco medidas de tronco e converte a data informada", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "cliente-1" } });
    mockCreate.mockResolvedValue({});

    await criarRegistroMedida(
      buildFormData({
        data: "2026-01-15",
        peso: "60",
        altura: "165",
        ombro: "40",
        peitoBusto: "90",
        cintura: "70",
        abdomen: "75",
        quadril: "95",
      }),
    );

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        clienteId: "cliente-1",
        data: new Date("2026-01-15"),
        ...TODOS_OS_CAMPOS_UNDEFINED,
        peso: 60,
        altura: 165,
        ombro: 40,
        peitoBusto: 90,
        cintura: 70,
        abdomen: 75,
        quadril: 95,
      },
    });
  });

  it("aceita valores diferentes para o lado direito e esquerdo de uma medida de membro", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "cliente-1" } });
    mockCreate.mockResolvedValue({});

    await criarRegistroMedida(
      buildFormData({ bracoDireito: "30", bracoEsquerdo: "28" }),
    );

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        clienteId: "cliente-1",
        data: undefined,
        ...TODOS_OS_CAMPOS_UNDEFINED,
        bracoDireito: 30,
        bracoEsquerdo: 28,
      },
    });
  });
});
