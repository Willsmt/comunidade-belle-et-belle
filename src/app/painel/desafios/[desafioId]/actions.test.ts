import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRequererAcessoPainel,
  mockCategoriaCreate,
  mockCategoriaDelete,
  mockCategoriaFindUniqueOrThrow,
  mockItemCreate,
  mockItemDelete,
  mockRegraCreate,
  mockRegraDelete,
  mockRevalidatePath,
} = vi.hoisted(() => ({
  mockRequererAcessoPainel: vi.fn(),
  mockCategoriaCreate: vi.fn(),
  mockCategoriaDelete: vi.fn(),
  mockCategoriaFindUniqueOrThrow: vi.fn(),
  mockItemCreate: vi.fn(),
  mockItemDelete: vi.fn(),
  mockRegraCreate: vi.fn(),
  mockRegraDelete: vi.fn(),
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
    regraBonus: { create: mockRegraCreate, delete: mockRegraDelete },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));

import {
  criarCategoria,
  removerCategoria,
  criarItem,
  removerItem,
  criarRegraLimiar,
  criarRegraCombo,
  criarRegraCategoriaCompleta,
  removerRegraBonus,
} from "./actions";

function buildFormData(campos: Record<string, string | string[]>) {
  const formData = new FormData();
  for (const [chave, valor] of Object.entries(campos)) {
    if (Array.isArray(valor)) {
      for (const item of valor) {
        formData.append(chave, item);
      }
    } else {
      formData.set(chave, valor);
    }
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

describe("criarRegraLimiar", () => {
  beforeEach(() => {
    mockRequererAcessoPainel.mockReset();
    mockRegraCreate.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige acesso ao painel", async () => {
    mockRequererAcessoPainel.mockRejectedValue(new Error("Acesso negado"));

    await expect(
      criarRegraLimiar("d1", buildFormData({ pontosExtras: "10", limiarItens: "4" })),
    ).rejects.toThrow("Acesso negado");
    expect(mockRegraCreate).not.toHaveBeenCalled();
  });

  it("rejeita pontuação extra inválida", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });

    await expect(
      criarRegraLimiar("d1", buildFormData({ pontosExtras: "0", limiarItens: "4" })),
    ).rejects.toThrow("Informe uma pontuação extra válida");
    expect(mockRegraCreate).not.toHaveBeenCalled();
  });

  it("rejeita limiar inválido", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });

    await expect(
      criarRegraLimiar("d1", buildFormData({ pontosExtras: "10", limiarItens: "0" })),
    ).rejects.toThrow("Informe um limiar de itens válido");
    expect(mockRegraCreate).not.toHaveBeenCalled();
  });

  it("cria a regra de limiar diário", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockRegraCreate.mockResolvedValue({});

    await criarRegraLimiar("d1", buildFormData({ pontosExtras: "10", limiarItens: "4" }));

    expect(mockRegraCreate).toHaveBeenCalledWith({
      data: { desafioId: "d1", tipo: "LIMIAR_DIARIO", pontosExtras: 10, limiarItens: 4 },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/desafios/d1");
  });
});

describe("criarRegraCombo", () => {
  beforeEach(() => {
    mockRequererAcessoPainel.mockReset();
    mockRegraCreate.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige acesso ao painel", async () => {
    mockRequererAcessoPainel.mockRejectedValue(new Error("Acesso negado"));

    await expect(
      criarRegraCombo("d1", buildFormData({ pontosExtras: "10", itensCombo: ["i1", "i2"] })),
    ).rejects.toThrow("Acesso negado");
    expect(mockRegraCreate).not.toHaveBeenCalled();
  });

  it("rejeita com menos de 2 itens selecionados", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });

    await expect(
      criarRegraCombo("d1", buildFormData({ pontosExtras: "10", itensCombo: ["i1"] })),
    ).rejects.toThrow("Selecione pelo menos 2 itens pro combo");
    expect(mockRegraCreate).not.toHaveBeenCalled();
  });

  it("cria a regra de combo conectando os itens selecionados", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockRegraCreate.mockResolvedValue({});

    await criarRegraCombo("d1", buildFormData({ pontosExtras: "10", itensCombo: ["i1", "i2"] }));

    expect(mockRegraCreate).toHaveBeenCalledWith({
      data: {
        desafioId: "d1",
        tipo: "COMBO",
        pontosExtras: 10,
        itensCombo: { connect: [{ id: "i1" }, { id: "i2" }] },
      },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/desafios/d1");
  });
});

describe("criarRegraCategoriaCompleta", () => {
  beforeEach(() => {
    mockRequererAcessoPainel.mockReset();
    mockCategoriaFindUniqueOrThrow.mockReset();
    mockRegraCreate.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige acesso ao painel", async () => {
    mockRequererAcessoPainel.mockRejectedValue(new Error("Acesso negado"));

    await expect(
      criarRegraCategoriaCompleta("d1", buildFormData({ pontosExtras: "10", categoriaId: "c1" })),
    ).rejects.toThrow("Acesso negado");
    expect(mockRegraCreate).not.toHaveBeenCalled();
  });

  it("rejeita sem categoria selecionada", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });

    await expect(
      criarRegraCategoriaCompleta("d1", buildFormData({ pontosExtras: "10" })),
    ).rejects.toThrow("Selecione a categoria");
    expect(mockRegraCreate).not.toHaveBeenCalled();
  });

  it("cria a regra de categoria completa", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockCategoriaFindUniqueOrThrow.mockResolvedValue({ id: "c1" });
    mockRegraCreate.mockResolvedValue({});

    await criarRegraCategoriaCompleta("d1", buildFormData({ pontosExtras: "10", categoriaId: "c1" }));

    expect(mockCategoriaFindUniqueOrThrow).toHaveBeenCalledWith({ where: { id: "c1" } });
    expect(mockRegraCreate).toHaveBeenCalledWith({
      data: { desafioId: "d1", tipo: "CATEGORIA_COMPLETA", pontosExtras: 10, categoriaId: "c1" },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/desafios/d1");
  });
});

describe("removerRegraBonus", () => {
  beforeEach(() => {
    mockRequererAcessoPainel.mockReset();
    mockRegraDelete.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige acesso ao painel", async () => {
    mockRequererAcessoPainel.mockRejectedValue(new Error("Acesso negado"));

    await expect(removerRegraBonus("r1")).rejects.toThrow("Acesso negado");
    expect(mockRegraDelete).not.toHaveBeenCalled();
  });

  it("remove a regra e revalida a página do desafio dela", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockRegraDelete.mockResolvedValue({ id: "r1", desafioId: "d1" });

    await removerRegraBonus("r1");

    expect(mockRegraDelete).toHaveBeenCalledWith({ where: { id: "r1" } });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/desafios/d1");
  });
});
