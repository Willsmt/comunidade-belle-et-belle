import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRequererAcessoPainel,
  mockCategoriaCreate,
  mockCategoriaDelete,
  mockCategoriaFindUniqueOrThrow,
  mockItemCreate,
  mockItemDelete,
  mockRevalidatePath,
} = vi.hoisted(() => ({
  mockRequererAcessoPainel: vi.fn(),
  mockCategoriaCreate: vi.fn(),
  mockCategoriaDelete: vi.fn(),
  mockCategoriaFindUniqueOrThrow: vi.fn(),
  mockItemCreate: vi.fn(),
  mockItemDelete: vi.fn(),
  mockRevalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth/requerer-acesso-painel", () => ({
  requererAcessoPainel: mockRequererAcessoPainel,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    categoriaDesafio: {
      create: mockCategoriaCreate,
      delete: mockCategoriaDelete,
      findUniqueOrThrow: mockCategoriaFindUniqueOrThrow,
    },
    itemDesafio: { create: mockItemCreate, delete: mockItemDelete },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));

import { criarCategoria, removerCategoria, criarItem, removerItem } from "./actions";

function buildFormData(campos: Record<string, string>) {
  const formData = new FormData();
  for (const [chave, valor] of Object.entries(campos)) {
    formData.set(chave, valor);
  }
  return formData;
}

describe("criarCategoria", () => {
  beforeEach(() => {
    mockRequererAcessoPainel.mockReset();
    mockCategoriaCreate.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige acesso ao painel", async () => {
    mockRequererAcessoPainel.mockRejectedValue(new Error("Acesso negado"));

    await expect(
      criarCategoria("d1", buildFormData({ nome: "Pele", cor: "#f5c" })),
    ).rejects.toThrow("Acesso negado");
    expect(mockCategoriaCreate).not.toHaveBeenCalled();
  });

  it("rejeita sem nome", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });

    await expect(
      criarCategoria("d1", buildFormData({ cor: "#f5c" })),
    ).rejects.toThrow("Informe o nome da categoria");
    expect(mockCategoriaCreate).not.toHaveBeenCalled();
  });

  it("rejeita sem cor", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });

    await expect(
      criarCategoria("d1", buildFormData({ nome: "Pele" })),
    ).rejects.toThrow("Informe a cor da categoria");
    expect(mockCategoriaCreate).not.toHaveBeenCalled();
  });

  it("cria a categoria vinculada ao desafio", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockCategoriaCreate.mockResolvedValue({});

    await criarCategoria("d1", buildFormData({ nome: "Pele", cor: "#f5c" }));

    expect(mockCategoriaCreate).toHaveBeenCalledWith({
      data: { desafioId: "d1", nome: "Pele", cor: "#f5c" },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/desafios/d1");
  });
});

describe("removerCategoria", () => {
  beforeEach(() => {
    mockRequererAcessoPainel.mockReset();
    mockCategoriaDelete.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige acesso ao painel", async () => {
    mockRequererAcessoPainel.mockRejectedValue(new Error("Acesso negado"));

    await expect(removerCategoria("c1")).rejects.toThrow("Acesso negado");
    expect(mockCategoriaDelete).not.toHaveBeenCalled();
  });

  it("remove a categoria e revalida a página do desafio dela", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockCategoriaDelete.mockResolvedValue({ id: "c1", desafioId: "d1" });

    await removerCategoria("c1");

    expect(mockCategoriaDelete).toHaveBeenCalledWith({ where: { id: "c1" } });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/desafios/d1");
  });
});

describe("criarItem", () => {
  beforeEach(() => {
    mockRequererAcessoPainel.mockReset();
    mockCategoriaFindUniqueOrThrow.mockReset();
    mockItemCreate.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige acesso ao painel", async () => {
    mockRequererAcessoPainel.mockRejectedValue(new Error("Acesso negado"));

    await expect(
      criarItem("c1", buildFormData({ descricao: "Beber água", pontos: "5", frequencia: "DIARIO" })),
    ).rejects.toThrow("Acesso negado");
    expect(mockItemCreate).not.toHaveBeenCalled();
  });

  it("rejeita sem descrição", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });

    await expect(
      criarItem("c1", buildFormData({ pontos: "5", frequencia: "DIARIO" })),
    ).rejects.toThrow("Informe a descrição do item");
    expect(mockItemCreate).not.toHaveBeenCalled();
  });

  it("rejeita pontuação inválida", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });

    await expect(
      criarItem("c1", buildFormData({ descricao: "Beber água", pontos: "abc", frequencia: "DIARIO" })),
    ).rejects.toThrow("Informe uma pontuação válida");
    expect(mockItemCreate).not.toHaveBeenCalled();
  });

  it("rejeita pontuação zero ou negativa", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });

    await expect(
      criarItem("c1", buildFormData({ descricao: "Beber água", pontos: "0", frequencia: "DIARIO" })),
    ).rejects.toThrow("Informe uma pontuação válida");
    expect(mockItemCreate).not.toHaveBeenCalled();
  });

  it("rejeita frequência inválida", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });

    await expect(
      criarItem("c1", buildFormData({ descricao: "Beber água", pontos: "5", frequencia: "MENSAL" })),
    ).rejects.toThrow("Informe uma frequência válida");
    expect(mockItemCreate).not.toHaveBeenCalled();
  });

  it("cria o item vinculado à categoria", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockCategoriaFindUniqueOrThrow.mockResolvedValue({ id: "c1", desafioId: "d1" });
    mockItemCreate.mockResolvedValue({});

    await criarItem("c1", buildFormData({ descricao: "Beber água", pontos: "5", frequencia: "DIARIO" }));

    expect(mockItemCreate).toHaveBeenCalledWith({
      data: { categoriaId: "c1", descricao: "Beber água", pontos: 5, frequencia: "DIARIO" },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/desafios/d1");
  });
});

describe("removerItem", () => {
  beforeEach(() => {
    mockRequererAcessoPainel.mockReset();
    mockItemDelete.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige acesso ao painel", async () => {
    mockRequererAcessoPainel.mockRejectedValue(new Error("Acesso negado"));

    await expect(removerItem("i1")).rejects.toThrow("Acesso negado");
    expect(mockItemDelete).not.toHaveBeenCalled();
  });

  it("remove o item e revalida a página do desafio da categoria dele", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockItemDelete.mockResolvedValue({ id: "i1", categoria: { desafioId: "d1" } });

    await removerItem("i1");

    expect(mockItemDelete).toHaveBeenCalledWith({
      where: { id: "i1" },
      include: { categoria: true },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/desafios/d1");
  });
});
