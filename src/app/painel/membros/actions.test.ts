import { beforeEach, describe, expect, it, vi } from "vitest";
const {
  mockRequererAcesso,
  mockUpdate,
  mockDelete,
  mockCount,
  mockUpsert,
  mockDeleteMany,
  mockUpdateManyVinculo,
  mockTransaction,
  mockRevalidatePath,
} = vi.hoisted(() => ({
  mockRequererAcesso: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
  mockCount: vi.fn(),
  mockUpsert: vi.fn(),
  mockDeleteMany: vi.fn(),
  mockUpdateManyVinculo: vi.fn(),
  mockTransaction: vi.fn(),
  mockRevalidatePath: vi.fn(),
}));
vi.mock("@/lib/auth/requerer-acesso-painel", () => ({
  requererAcessoPainel: mockRequererAcesso,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { update: mockUpdate, delete: mockDelete, count: mockCount },
    usuarioPapel: { upsert: mockUpsert, deleteMany: mockDeleteMany },
    vinculoParceria: { updateMany: mockUpdateManyVinculo },
    $transaction: mockTransaction,
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
import {
  suspenderMembro,
  reativarMembro,
  deletarMembro,
  promoverAParceria,
  revogarParceria,
  promoverAGestora,
  revogarGestora,
} from "./actions";
beforeEach(() => {
  mockRequererAcesso.mockReset();
  mockUpdate.mockReset();
  mockDelete.mockReset();
  mockCount.mockReset();
  mockUpsert.mockReset();
  mockDeleteMany.mockReset();
  mockUpdateManyVinculo.mockReset();
  mockTransaction.mockReset();
  mockRevalidatePath.mockReset();
  mockRequererAcesso.mockResolvedValue({ user: { id: "patty-1" } });
  mockCount.mockResolvedValue(1);
  mockTransaction.mockImplementation((ops: Promise<unknown>[]) =>
    Promise.all(ops),
  );
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
    expect(mockCount).toHaveBeenCalledWith({
      where: {
        id: { not: "u1" },
        status: "ATIVO",
        papeis: { some: { papel: { in: ["ADMIN", "GESTORA"] } } },
      },
    });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { status: "SUSPENSO" },
    });
  });
  it("bloqueia auto-suspensão, independente de quantos outros ADMIN/GESTORA existam", async () => {
    mockRequererAcesso.mockResolvedValue({ user: { id: "patty-1" } });
    mockCount.mockResolvedValue(5);
    await expect(suspenderMembro("patty-1")).rejects.toThrow(
      "Você não pode suspender a própria conta.",
    );
    expect(mockCount).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
  it("bloqueia se não sobrar nenhuma conta ADMIN/GESTORA ativa depois da ação", async () => {
    mockCount.mockResolvedValue(0);
    await expect(suspenderMembro("u1")).rejects.toThrow(
      "Não é possível suspender: não sobraria nenhuma conta ADMIN ou GESTORA ativa.",
    );
    expect(mockUpdate).not.toHaveBeenCalled();
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
    expect(mockCount).toHaveBeenCalledWith({
      where: {
        id: { not: "u1" },
        status: "ATIVO",
        papeis: { some: { papel: { in: ["ADMIN", "GESTORA"] } } },
      },
    });
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "u1" } });
  });
  it("bloqueia auto-exclusão, independente de quantos outros ADMIN/GESTORA existam", async () => {
    mockRequererAcesso.mockResolvedValue({ user: { id: "patty-1" } });
    mockCount.mockResolvedValue(5);
    await expect(deletarMembro("patty-1")).rejects.toThrow(
      "Você não pode deletar a própria conta.",
    );
    expect(mockCount).not.toHaveBeenCalled();
    expect(mockDelete).not.toHaveBeenCalled();
  });
  it("bloqueia se não sobrar nenhuma conta ADMIN/GESTORA ativa depois da ação", async () => {
    mockCount.mockResolvedValue(0);
    await expect(deletarMembro("u1")).rejects.toThrow(
      "Não é possível deletar: não sobraria nenhuma conta ADMIN ou GESTORA ativa.",
    );
    expect(mockDelete).not.toHaveBeenCalled();
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
    expect(mockTransaction).not.toHaveBeenCalled();
  });
  it("remove o papel PARCERIA e desativa os vínculos ativos dessa parceria, na mesma transação", async () => {
    mockDeleteMany.mockResolvedValue({ count: 1 });
    mockUpdateManyVinculo.mockResolvedValue({ count: 2 });
    await revogarParceria("u1");
    expect(mockDeleteMany).toHaveBeenCalledWith({
      where: { userId: "u1", papel: "PARCERIA" },
    });
    expect(mockUpdateManyVinculo).toHaveBeenCalledWith({
      where: { parceriaId: "u1", ativo: true },
      data: { ativo: false },
    });
    expect(mockTransaction).toHaveBeenCalledTimes(1);
  });
});
describe("promoverAGestora", () => {
  it("nega sem acesso", async () => {
    mockRequererAcesso.mockRejectedValue(new Error("Acesso negado"));
    await expect(promoverAGestora("u1")).rejects.toThrow("Acesso negado");
    expect(mockUpsert).not.toHaveBeenCalled();
  });
  it("bloqueia se quem chama não for ADMIN", async () => {
    mockRequererAcesso.mockResolvedValue({
      user: { id: "patty-1", papeis: ["GESTORA"] },
    });
    await expect(promoverAGestora("u1")).rejects.toThrow(
      "Só uma conta ADMIN pode gerenciar o papel de Gestora.",
    );
    expect(mockUpsert).not.toHaveBeenCalled();
  });
  it("cria o papel GESTORA via upsert quando quem chama é ADMIN (idempotente se já existir)", async () => {
    mockRequererAcesso.mockResolvedValue({
      user: { id: "patty-1", papeis: ["ADMIN"] },
    });
    mockUpsert.mockResolvedValue({});
    await promoverAGestora("u1");
    expect(mockUpsert).toHaveBeenCalledWith({
      where: { userId_papel: { userId: "u1", papel: "GESTORA" } },
      create: { userId: "u1", papel: "GESTORA" },
      update: {},
    });
  });
});
describe("revogarGestora", () => {
  it("nega sem acesso", async () => {
    mockRequererAcesso.mockRejectedValue(new Error("Acesso negado"));
    await expect(revogarGestora("u1")).rejects.toThrow("Acesso negado");
    expect(mockDeleteMany).not.toHaveBeenCalled();
  });
  it("bloqueia se quem chama não for ADMIN", async () => {
    mockRequererAcesso.mockResolvedValue({
      user: { id: "patty-1", papeis: ["GESTORA"] },
    });
    await expect(revogarGestora("u1")).rejects.toThrow(
      "Só uma conta ADMIN pode gerenciar o papel de Gestora.",
    );
    expect(mockDeleteMany).not.toHaveBeenCalled();
  });
  it("bloqueia se não sobrar nenhuma conta ADMIN/GESTORA ativa depois da ação", async () => {
    mockRequererAcesso.mockResolvedValue({
      user: { id: "patty-1", papeis: ["ADMIN"] },
    });
    mockCount.mockResolvedValue(0);
    await expect(revogarGestora("u1")).rejects.toThrow(
      "Não é possível revogar: não sobraria nenhuma conta ADMIN ou GESTORA ativa.",
    );
    expect(mockDeleteMany).not.toHaveBeenCalled();
  });
  it("remove o papel GESTORA quando quem chama é ADMIN e não causa lockout", async () => {
    mockRequererAcesso.mockResolvedValue({
      user: { id: "patty-1", papeis: ["ADMIN"] },
    });
    mockDeleteMany.mockResolvedValue({ count: 1 });
    await revogarGestora("u1");
    expect(mockDeleteMany).toHaveBeenCalledWith({
      where: { userId: "u1", papel: "GESTORA" },
    });
  });
});
