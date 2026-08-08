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

import { aprovarConta, rejeitarConta } from "./actions";

describe("aprovarConta", () => {
  beforeEach(() => {
    mockRequererAcesso.mockReset();
    mockUpdate.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("nega e não atualiza nada se o acesso for negado", async () => {
    mockRequererAcesso.mockRejectedValue(new Error("Acesso negado"));
    await expect(aprovarConta("user-1")).rejects.toThrow("Acesso negado");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("aprova e registra quem aprovou", async () => {
    mockRequererAcesso.mockResolvedValue({ user: { id: "patty-1" } });
    mockUpdate.mockResolvedValue({});

    await aprovarConta("user-1");

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        status: "ATIVO",
        aprovadoPor: "patty-1",
        aprovadoEm: expect.any(Date),
      },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/aprovacoes");
  });
});

describe("rejeitarConta", () => {
  beforeEach(() => {
    mockRequererAcesso.mockReset();
    mockDelete.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("nega e não deleta nada se o acesso for negado", async () => {
    mockRequererAcesso.mockRejectedValue(new Error("Acesso negado"));
    await expect(rejeitarConta("user-1")).rejects.toThrow("Acesso negado");
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("deleta o registro do usuário", async () => {
    mockRequererAcesso.mockResolvedValue({ user: { id: "patty-1" } });
    mockDelete.mockResolvedValue({});

    await rejeitarConta("user-1");

    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "user-1" } });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/aprovacoes");
  });
});
