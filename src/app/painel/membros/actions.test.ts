import { beforeEach, describe, expect, it, vi } from "vitest";
const {
  mockRequererAcesso,
  mockUpdate,
  mockDelete,
  mockUpsert,
  mockDeleteMany,
  mockRevalidatePath,
} = vi.hoisted(() => ({
  mockRequererAcesso: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
  mockUpsert: vi.fn(),
  mockDeleteMany: vi.fn(),
  mockRevalidatePath: vi.fn(),
}));
vi.mock("@/lib/auth/requerer-acesso-painel", () => ({
  requererAcessoPainel: mockRequererAcesso,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { update: mockUpdate, delete: mockDelete },
    usuarioPapel: { upsert: mockUpsert, deleteMany: mockDeleteMany },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
import {
  suspenderMembro,
  reativarMembro,
  deletarMembro,
  promoverAParceria,
  revogarParceria,
} from "./actions";
beforeEach(() => {
  mockRequererAcesso.mockReset();
  mockUpdate.mockReset();
  mockDelete.mockReset();
  mockUpsert.mockReset();
  mockDeleteMany.mockReset();
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
describe("promoverAParceria", () => {
  it("nega sem acesso", async () => {
    mockRequererAcesso.mockRejectedValue(new Error("Acesso negado"));
    await expect(promoverAParceria("u1")).rejects.toThrow("Acesso negado");
    expect(mockUpsert).not.toHaveBeenCalled();
  });
  it("cria o papel PARCERIA via upsert (idempotente se já existir)", async () => {
    mockUpsert.mockResolvedValue({});
    await promoverAParceria("u1");
    expect(mockUpsert).toHaveBeenCalledWith({
      where: { userId_papel: { userId: "u1", papel: "PARCERIA" } },
      create: { userId: "u1", papel: "PARCERIA" },
      update: {},
    });
  });
});
describe("revogarParceria", () => {
  it("nega sem acesso", async () => {
    mockRequererAcesso.mockRejectedValue(new Error("Acesso negado"));
    await expect(revogarParceria("u1")).rejects.toThrow("Acesso negado");
    expect(mockDeleteMany).not.toHaveBeenCalled();
  });
  it("remove o papel PARCERIA do usuário", async () => {
    mockDeleteMany.mockResolvedValue({ count: 1 });
    await revogarParceria("u1");
    expect(mockDeleteMany).toHaveBeenCalledWith({
      where: { userId: "u1", papel: "PARCERIA" },
    });
  });
});
