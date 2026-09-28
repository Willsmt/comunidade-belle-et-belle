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

import { DriverAdapterError } from "@prisma/driver-adapter-utils";
import { Prisma } from "@/generated/prisma/client";
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
    ).rejects.toThrow("Não foi possível concluir a ação.");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejeita sem nome", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });

    await expect(criarEmblema(buildFormData({}))).rejects.toThrow(
      "Informe o nome do emblema",
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejeita nome acima de 60 caracteres", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });

    await expect(
      criarEmblema(buildFormData({ nome: "a".repeat(61) })),
    ).rejects.toThrow("Nome muito longo");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejeita descrição acima de 200 caracteres", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });

    await expect(
      criarEmblema(
        buildFormData({ nome: "Campeã da Semana", descricao: "a".repeat(201) }),
      ),
    ).rejects.toThrow("Descrição muito longa");
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
      buildFormData({ nome: "Campeã da Semana", icone: "Trophy", descricao: "Venceu o ranking semanal" }),
    );

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        nome: "Campeã da Semana",
        descricao: "Venceu o ranking semanal",
        icone: "Trophy",
      },
    });
  });

  it("rejeita ícone fora da allowlist", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });

    await expect(
      criarEmblema(buildFormData({ nome: "Campeã da Semana", icone: "🏆" })),
    ).rejects.toThrow("Ícone inválido");
    expect(mockCreate).not.toHaveBeenCalled();
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

    await expect(removerEmblema("e1")).rejects.toThrow("Não foi possível concluir a ação.");
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("remove o emblema", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockDelete.mockResolvedValue({});

    await removerEmblema("e1");

    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "e1" } });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/desafios/emblemas");
  });

  it("traduz violação de FK (P2003, código mapeado) em mensagem amigável", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockDelete.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Foreign key constraint violated", {
        code: "P2003",
        clientVersion: "test",
      }),
    );

    await expect(removerEmblema("e1")).rejects.toThrow(
      "Não é possível remover: esse emblema já foi concedido a alguém.",
    );
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("traduz violação de RESTRICT via driver adapter (P2039 + SQLSTATE 23001) em mensagem amigável", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    const driverAdapterError = new DriverAdapterError({
      kind: "postgres",
      code: "23001",
      severity: "ERROR",
      message:
        'update or delete on table "Emblema" violates RESTRICT setting of foreign key constraint "Conquista_emblemaId_fkey" on table "Conquista"',
      detail: undefined,
      column: undefined,
      hint: undefined,
    });
    mockDelete.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError(
        "Database error. Code: `23001`. Message: `...`",
        {
          code: "P2039",
          clientVersion: "test",
          meta: { modelName: "Emblema", driverAdapterError },
        },
      ),
    );

    await expect(removerEmblema("e1")).rejects.toThrow(
      "Não é possível remover: esse emblema já foi concedido a alguém.",
    );
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("mascara erro não relacionado a FK com a mensagem genérica", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockDelete.mockRejectedValue(new Error("Falha de conexão com o banco"));

    await expect(removerEmblema("e1")).rejects.toThrow(
      "Não foi possível concluir a ação.",
    );
  });
});
