import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequererAcesso, mockUpdate, mockDelete, mockRevalidatePath } = vi.hoisted(() => ({
  mockRequererAcesso: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
  mockRevalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth/requerer-acesso-painel", () => ({
  requererAcessoPainel: mockRequererAcesso,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { update: mockUpdate, delete: mockDelete } },
}));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));

import { suspenderMembro, reativarMembro, deletarMembro } from "./actions";

beforeEach(() => {
  mockRequererAcesso.mockReset();
  mockUpdate.mockReset();
  mockDelete.mockReset();
  mockRevalidatePath.mockReset();
  mockRequererAcesso.mockResolvedValue({ user: { id: "patty-1" } });
});

describe("suspenderMembro", () => {
  it("nega sem acesso", async () => {
    mockRequererAcesso.mockRejectedValue(new Error("Acesso negado"));
    await expect(suspenderMembro("u1")).rejects.toThrow("Acesso negado");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("muda status pra SUSPENSO", async () => {
    mockUpdate.mockResolvedValue({});
    await suspenderMembro("u1");
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { status: "SUSPENSO" },
    });
  });
});

describe("reativarMembro", () => {
  it("nega sem acesso", async () => {
    mockRequererAcesso.mockRejectedValue(new Error("Acesso negado"));
    await expect(reativarMembro("u1")).rejects.toThrow("Acesso negado");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("muda status pra ATIVO", async () => {
    mockUpdate.mockResolvedValue({});
    await reativarMembro("u1");
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { status: "ATIVO" },
    });
  });
});

describe("deletarMembro", () => {
  it("nega sem acesso", async () => {
    mockRequererAcesso.mockRejectedValue(new Error("Acesso negado"));
    await expect(deletarMembro("u1")).rejects.toThrow("Acesso negado");
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("deleta o registro", async () => {
    mockDelete.mockResolvedValue({});
    await deletarMembro("u1");
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "u1" } });
  });
});
