import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/actions/executar-action";

const {
  mockRequererAcessoPainel,
  mockCategoriaCreate,
  mockCategoriaDelete,
  mockCategoriaFindUniqueOrThrow,
  mockItemCreate,
  mockItemDelete,
  mockItemFindUniqueOrThrow,
  mockItemUpdate,
  mockRegraCreate,
  mockRegraDelete,
  mockSurpresaCreate,
  mockSurpresaDelete,
  mockParticipacaoUpdate,
  mockParticipacaoDelete,
  mockParticipacaoFindMany,
  mockParticipacaoFindUniqueOrThrow,
  mockMarcacaoFindMany,
  mockApagarObjeto,
  mockRevalidatePath,
} = vi.hoisted(() => ({
  mockRequererAcessoPainel: vi.fn(),
  mockCategoriaCreate: vi.fn(),
  mockCategoriaDelete: vi.fn(),
  mockCategoriaFindUniqueOrThrow: vi.fn(),
  mockItemCreate: vi.fn(),
  mockItemDelete: vi.fn(),
  mockItemFindUniqueOrThrow: vi.fn(),
  mockItemUpdate: vi.fn(),
  mockRegraCreate: vi.fn(),
  mockRegraDelete: vi.fn(),
  mockSurpresaCreate: vi.fn(),
  mockSurpresaDelete: vi.fn(),
  mockParticipacaoUpdate: vi.fn(),
  mockParticipacaoDelete: vi.fn(),
  mockParticipacaoFindMany: vi.fn(),
  mockParticipacaoFindUniqueOrThrow: vi.fn(),
  mockMarcacaoFindMany: vi.fn(),
  mockApagarObjeto: vi.fn(),
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
    itemDesafio: {
      create: mockItemCreate,
      delete: mockItemDelete,
      findUniqueOrThrow: mockItemFindUniqueOrThrow,
      update: mockItemUpdate,
    },
    regraBonus: { create: mockRegraCreate, delete: mockRegraDelete },
    desafioSurpresa: { create: mockSurpresaCreate, delete: mockSurpresaDelete },
    participacaoSurpresa: {
      update: mockParticipacaoUpdate,
      delete: mockParticipacaoDelete,
      findMany: mockParticipacaoFindMany,
      findUniqueOrThrow: mockParticipacaoFindUniqueOrThrow,
    },
    marcacaoItem: { findMany: mockMarcacaoFindMany },
  },
}));
vi.mock("@/lib/storage/objetos", () => ({
  apagarObjetoEmMelhorEsforco: mockApagarObjeto,
}));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));

import {
  criarCategoria,
  removerCategoria,
  criarItem,
  removerItem,
  alternarExigeFoto,
  criarRegraLimiar,
  criarRegraCombo,
  criarRegraCategoriaCompleta,
  removerRegraBonus,
  criarDesafioSurpresa,
  removerDesafioSurpresa,
  aprovarParticipacao,
  rejeitarParticipacao,
} from "./actions";

beforeEach(() => {
  mockApagarObjeto.mockReset().mockResolvedValue(undefined);
  mockMarcacaoFindMany.mockReset().mockResolvedValue([]);
  mockParticipacaoFindMany.mockReset().mockResolvedValue([]);
});


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
    mockRequererAcessoPainel.mockRejectedValue(new AppError("Acesso negado"));

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
    mockRequererAcessoPainel.mockRejectedValue(new AppError("Acesso negado"));

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

  it("lista os comprovantes da categoria, deleta no banco e só depois apaga os objetos", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockMarcacaoFindMany.mockResolvedValue([
      { fotoChave: "comprovantes-item/c1/a.webp" },
      { fotoChave: "comprovantes-item/c2/b.webp" },
    ]);
    const ordem: string[] = [];
    mockCategoriaDelete.mockImplementation(async () => {
      ordem.push("banco");
      return { id: "c1", desafioId: "d1" };
    });
    mockApagarObjeto.mockImplementation(async () => {
      ordem.push("r2");
    });

    await removerCategoria("c1");

    expect(mockMarcacaoFindMany).toHaveBeenCalledWith({
      where: { item: { categoriaId: "c1" }, fotoChave: { not: null } },
      select: { fotoChave: true },
    });
    expect(mockApagarObjeto).toHaveBeenCalledWith("comprovantes-item/c1/a.webp", expect.any(String));
    expect(mockApagarObjeto).toHaveBeenCalledWith("comprovantes-item/c2/b.webp", expect.any(String));
    expect(ordem).toEqual(["banco", "r2", "r2"]);
  });

  it("se o delete no banco falhar, nenhum objeto é apagado", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockMarcacaoFindMany.mockResolvedValue([{ fotoChave: "comprovantes-item/c1/a.webp" }]);
    mockCategoriaDelete.mockRejectedValue(new Error("falha no banco"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(removerCategoria("c1")).rejects.toThrow();

    expect(mockApagarObjeto).not.toHaveBeenCalled();
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
    mockRequererAcessoPainel.mockRejectedValue(new AppError("Acesso negado"));

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

  it("cria o item vinculado à categoria, sem exigir foto por padrão", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockCategoriaFindUniqueOrThrow.mockResolvedValue({ id: "c1", desafioId: "d1" });
    mockItemCreate.mockResolvedValue({});

    await criarItem("c1", buildFormData({ descricao: "Beber água", pontos: "5", frequencia: "DIARIO" }));

    expect(mockItemCreate).toHaveBeenCalledWith({
      data: {
        categoriaId: "c1",
        descricao: "Beber água",
        pontos: 5,
        frequencia: "DIARIO",
        exigeFoto: false,
      },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/desafios/d1");
  });

  it("cria o item exigindo foto quando o checkbox vem marcado", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockCategoriaFindUniqueOrThrow.mockResolvedValue({ id: "c1", desafioId: "d1" });
    mockItemCreate.mockResolvedValue({});

    await criarItem(
      "c1",
      buildFormData({
        descricao: "Ida à academia",
        pontos: "5",
        frequencia: "DIARIO",
        exigeFoto: "on",
      }),
    );

    expect(mockItemCreate).toHaveBeenCalledWith({
      data: {
        categoriaId: "c1",
        descricao: "Ida à academia",
        pontos: 5,
        frequencia: "DIARIO",
        exigeFoto: true,
      },
    });
  });
});

describe("removerItem", () => {
  beforeEach(() => {
    mockRequererAcessoPainel.mockReset();
    mockItemDelete.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige acesso ao painel", async () => {
    mockRequererAcessoPainel.mockRejectedValue(new AppError("Acesso negado"));

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

  it("lista os comprovantes do item, deleta no banco e só depois apaga os objetos", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockMarcacaoFindMany.mockResolvedValue([{ fotoChave: "comprovantes-item/c1/a.webp" }]);
    const ordem: string[] = [];
    mockItemDelete.mockImplementation(async () => {
      ordem.push("banco");
      return { id: "i1", categoria: { desafioId: "d1" } };
    });
    mockApagarObjeto.mockImplementation(async () => {
      ordem.push("r2");
    });

    await removerItem("i1");

    expect(mockMarcacaoFindMany).toHaveBeenCalledWith({
      where: { itemId: "i1", fotoChave: { not: null } },
      select: { fotoChave: true },
    });
    expect(mockApagarObjeto).toHaveBeenCalledWith("comprovantes-item/c1/a.webp", expect.any(String));
    expect(ordem).toEqual(["banco", "r2"]);
  });

  it("se o delete no banco falhar, nenhum objeto é apagado", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockMarcacaoFindMany.mockResolvedValue([{ fotoChave: "comprovantes-item/c1/a.webp" }]);
    mockItemDelete.mockRejectedValue(new Error("falha no banco"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(removerItem("i1")).rejects.toThrow();

    expect(mockApagarObjeto).not.toHaveBeenCalled();
  });

});

describe("alternarExigeFoto", () => {
  beforeEach(() => {
    mockRequererAcessoPainel.mockReset();
    mockItemFindUniqueOrThrow.mockReset();
    mockItemUpdate.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige acesso ao painel", async () => {
    mockRequererAcessoPainel.mockRejectedValue(new AppError("Acesso negado"));

    await expect(alternarExigeFoto("i1")).rejects.toThrow("Acesso negado");
    expect(mockItemUpdate).not.toHaveBeenCalled();
  });

  it("rejeita item inexistente", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockItemFindUniqueOrThrow.mockRejectedValue(new Error("registro não encontrado"));

    await expect(alternarExigeFoto("inexistente")).rejects.toThrow();
    expect(mockItemUpdate).not.toHaveBeenCalled();
  });

  it("inverte exigeFoto de false para true", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockItemFindUniqueOrThrow.mockResolvedValue({
      id: "i1",
      exigeFoto: false,
      categoria: { desafioId: "d1" },
    });
    mockItemUpdate.mockResolvedValue({});

    await alternarExigeFoto("i1");

    expect(mockItemUpdate).toHaveBeenCalledWith({
      where: { id: "i1" },
      data: { exigeFoto: true },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/desafios/d1");
  });

  it("inverte exigeFoto de true para false", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockItemFindUniqueOrThrow.mockResolvedValue({
      id: "i1",
      exigeFoto: true,
      categoria: { desafioId: "d1" },
    });
    mockItemUpdate.mockResolvedValue({});

    await alternarExigeFoto("i1");

    expect(mockItemUpdate).toHaveBeenCalledWith({
      where: { id: "i1" },
      data: { exigeFoto: false },
    });
  });
});

describe("criarRegraLimiar", () => {
  beforeEach(() => {
    mockRequererAcessoPainel.mockReset();
    mockRegraCreate.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige acesso ao painel", async () => {
    mockRequererAcessoPainel.mockRejectedValue(new AppError("Acesso negado"));

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

  it("cria a regra de limiar diário sem emblema por padrão", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockRegraCreate.mockResolvedValue({});

    await criarRegraLimiar("d1", buildFormData({ pontosExtras: "10", limiarItens: "4" }));

    expect(mockRegraCreate).toHaveBeenCalledWith({
      data: {
        desafioId: "d1",
        tipo: "LIMIAR_DIARIO",
        pontosExtras: 10,
        limiarItens: 4,
        emblemaId: null,
      },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/desafios/d1");
  });

  it("cria a regra de limiar diário com o emblema selecionado", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockRegraCreate.mockResolvedValue({});

    await criarRegraLimiar(
      "d1",
      buildFormData({ pontosExtras: "10", limiarItens: "4", emblemaId: "e1" }),
    );

    expect(mockRegraCreate).toHaveBeenCalledWith({
      data: {
        desafioId: "d1",
        tipo: "LIMIAR_DIARIO",
        pontosExtras: 10,
        limiarItens: 4,
        emblemaId: "e1",
      },
    });
  });
});

describe("criarRegraCombo", () => {
  beforeEach(() => {
    mockRequererAcessoPainel.mockReset();
    mockRegraCreate.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige acesso ao painel", async () => {
    mockRequererAcessoPainel.mockRejectedValue(new AppError("Acesso negado"));

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

  it("cria a regra de combo conectando os itens selecionados, sem emblema por padrão", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockRegraCreate.mockResolvedValue({});

    await criarRegraCombo("d1", buildFormData({ pontosExtras: "10", itensCombo: ["i1", "i2"] }));

    expect(mockRegraCreate).toHaveBeenCalledWith({
      data: {
        desafioId: "d1",
        tipo: "COMBO",
        pontosExtras: 10,
        emblemaId: null,
        itensCombo: { connect: [{ id: "i1" }, { id: "i2" }] },
      },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/desafios/d1");
  });

  it("cria a regra de combo com o emblema selecionado", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockRegraCreate.mockResolvedValue({});

    await criarRegraCombo(
      "d1",
      buildFormData({ pontosExtras: "10", itensCombo: ["i1", "i2"], emblemaId: "e1" }),
    );

    expect(mockRegraCreate).toHaveBeenCalledWith({
      data: {
        desafioId: "d1",
        tipo: "COMBO",
        pontosExtras: 10,
        emblemaId: "e1",
        itensCombo: { connect: [{ id: "i1" }, { id: "i2" }] },
      },
    });
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
    mockRequererAcessoPainel.mockRejectedValue(new AppError("Acesso negado"));

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

  it("cria a regra de categoria completa sem emblema por padrão", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockCategoriaFindUniqueOrThrow.mockResolvedValue({ id: "c1" });
    mockRegraCreate.mockResolvedValue({});

    await criarRegraCategoriaCompleta("d1", buildFormData({ pontosExtras: "10", categoriaId: "c1" }));

    expect(mockCategoriaFindUniqueOrThrow).toHaveBeenCalledWith({ where: { id: "c1" } });
    expect(mockRegraCreate).toHaveBeenCalledWith({
      data: {
        desafioId: "d1",
        tipo: "CATEGORIA_COMPLETA",
        pontosExtras: 10,
        categoriaId: "c1",
        emblemaId: null,
      },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/desafios/d1");
  });

  it("cria a regra de categoria completa com o emblema selecionado", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockCategoriaFindUniqueOrThrow.mockResolvedValue({ id: "c1" });
    mockRegraCreate.mockResolvedValue({});

    await criarRegraCategoriaCompleta(
      "d1",
      buildFormData({ pontosExtras: "10", categoriaId: "c1", emblemaId: "e1" }),
    );

    expect(mockRegraCreate).toHaveBeenCalledWith({
      data: {
        desafioId: "d1",
        tipo: "CATEGORIA_COMPLETA",
        pontosExtras: 10,
        categoriaId: "c1",
        emblemaId: "e1",
      },
    });
  });
});

describe("removerRegraBonus", () => {
  beforeEach(() => {
    mockRequererAcessoPainel.mockReset();
    mockRegraDelete.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige acesso ao painel", async () => {
    mockRequererAcessoPainel.mockRejectedValue(new AppError("Acesso negado"));

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

describe("criarDesafioSurpresa", () => {
  beforeEach(() => {
    mockRequererAcessoPainel.mockReset();
    mockSurpresaCreate.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige acesso ao painel", async () => {
    mockRequererAcessoPainel.mockRejectedValue(new AppError("Acesso negado"));

    await expect(
      criarDesafioSurpresa("d1", buildFormData({ titulo: "Corrida 5km", pontos: "50" })),
    ).rejects.toThrow("Acesso negado");
    expect(mockSurpresaCreate).not.toHaveBeenCalled();
  });

  it("rejeita sem título", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });

    await expect(
      criarDesafioSurpresa("d1", buildFormData({ pontos: "50" })),
    ).rejects.toThrow("Informe o título do desafio surpresa");
    expect(mockSurpresaCreate).not.toHaveBeenCalled();
  });

  it("rejeita pontuação inválida", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });

    await expect(
      criarDesafioSurpresa("d1", buildFormData({ titulo: "Corrida 5km", pontos: "0" })),
    ).rejects.toThrow("Informe uma pontuação válida");
    expect(mockSurpresaCreate).not.toHaveBeenCalled();
  });

  it("cria o desafio surpresa sem exigir comprovação por padrão", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockSurpresaCreate.mockResolvedValue({});

    await criarDesafioSurpresa("d1", buildFormData({ titulo: "Corrida 5km", pontos: "50" }));

    expect(mockSurpresaCreate).toHaveBeenCalledWith({
      data: {
        desafioId: "d1",
        titulo: "Corrida 5km",
        descricao: null,
        pontos: 50,
        exigeComprovacao: false,
      },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/desafios/d1");
  });

  it("cria o desafio surpresa exigindo comprovação e com descrição", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockSurpresaCreate.mockResolvedValue({});

    await criarDesafioSurpresa(
      "d1",
      buildFormData({
        titulo: "Corrida 5km",
        descricao: "Manda o print",
        pontos: "50",
        exigeComprovacao: "on",
      }),
    );

    expect(mockSurpresaCreate).toHaveBeenCalledWith({
      data: {
        desafioId: "d1",
        titulo: "Corrida 5km",
        descricao: "Manda o print",
        pontos: 50,
        exigeComprovacao: true,
      },
    });
  });
});

describe("removerDesafioSurpresa", () => {
  beforeEach(() => {
    mockRequererAcessoPainel.mockReset();
    mockSurpresaDelete.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige acesso ao painel", async () => {
    mockRequererAcessoPainel.mockRejectedValue(new AppError("Acesso negado"));

    await expect(removerDesafioSurpresa("s1")).rejects.toThrow("Acesso negado");
    expect(mockSurpresaDelete).not.toHaveBeenCalled();
  });

  it("remove o desafio surpresa e revalida a página do desafio dele", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockSurpresaDelete.mockResolvedValue({ id: "s1", desafioId: "d1" });

    await removerDesafioSurpresa("s1");

    expect(mockSurpresaDelete).toHaveBeenCalledWith({ where: { id: "s1" } });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/desafios/d1");
  });

  it("lista os comprovantes das participações, deleta no banco e só depois apaga os objetos", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockParticipacaoFindMany.mockResolvedValue([
      { fotoChave: "comprovantes-surpresa/c1/a.webp" },
      { fotoChave: "comprovantes-surpresa/c2/b.webp" },
    ]);
    const ordem: string[] = [];
    mockSurpresaDelete.mockImplementation(async () => {
      ordem.push("banco");
      return { id: "s1", desafioId: "d1" };
    });
    mockApagarObjeto.mockImplementation(async () => {
      ordem.push("r2");
    });

    await removerDesafioSurpresa("s1");

    expect(mockParticipacaoFindMany).toHaveBeenCalledWith({
      where: { desafioSurpresaId: "s1", fotoChave: { not: null } },
      select: { fotoChave: true },
    });
    expect(ordem).toEqual(["banco", "r2", "r2"]);
  });

  it("se o delete no banco falhar, nenhum objeto é apagado", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockParticipacaoFindMany.mockResolvedValue([{ fotoChave: "comprovantes-surpresa/c1/a.webp" }]);
    mockSurpresaDelete.mockRejectedValue(new Error("falha no banco"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(removerDesafioSurpresa("s1")).rejects.toThrow();

    expect(mockApagarObjeto).not.toHaveBeenCalled();
  });

});

describe("aprovarParticipacao", () => {
  beforeEach(() => {
    mockRequererAcessoPainel.mockReset();
    mockParticipacaoUpdate.mockReset();
    mockParticipacaoFindUniqueOrThrow.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige acesso ao painel", async () => {
    mockRequererAcessoPainel.mockRejectedValue(new AppError("Acesso negado"));

    await expect(aprovarParticipacao("p1")).rejects.toThrow("Acesso negado");
    expect(mockParticipacaoUpdate).not.toHaveBeenCalled();
  });

  it("marca a participação como validada, zera fotoChave e revalida as duas rotas", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockParticipacaoFindUniqueOrThrow.mockResolvedValue({ id: "p1", fotoChave: null });
    mockParticipacaoUpdate.mockResolvedValue({
      id: "p1",
      fotoChave: null,
      desafioSurpresa: { desafioId: "d1" },
    });

    await aprovarParticipacao("p1");

    expect(mockParticipacaoUpdate).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: {
        validado: true,
        validadoPor: "patty-1",
        validadoEm: expect.any(Date),
        fotoChave: null,
      },
      include: { desafioSurpresa: true },
    });
    expect(mockApagarObjeto).not.toHaveBeenCalled();
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/desafios/d1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/aprovacoes");
  });

  it("apaga o objeto da chave anterior só depois da escrita no banco", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockParticipacaoFindUniqueOrThrow.mockResolvedValue({
      id: "p1",
      fotoChave: "comprovantes-surpresa/cliente-1/abc.webp",
    });
    const ordem: string[] = [];
    mockParticipacaoUpdate.mockImplementation(async () => {
      ordem.push("banco");
      return { id: "p1", fotoChave: null, desafioSurpresa: { desafioId: "d1" } };
    });
    mockApagarObjeto.mockImplementation(async () => {
      ordem.push("r2");
    });

    await aprovarParticipacao("p1");

    expect(mockApagarObjeto).toHaveBeenCalledWith(
      "comprovantes-surpresa/cliente-1/abc.webp",
      expect.any(String),
    );
    expect(ordem).toEqual(["banco", "r2"]);
  });

  it("se a escrita no banco falhar, não apaga o objeto", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockParticipacaoFindUniqueOrThrow.mockResolvedValue({
      id: "p1",
      fotoChave: "comprovantes-surpresa/cliente-1/abc.webp",
    });
    mockParticipacaoUpdate.mockRejectedValue(new Error("falha no banco"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(aprovarParticipacao("p1")).rejects.toThrow();

    expect(mockApagarObjeto).not.toHaveBeenCalled();
  });
});

describe("rejeitarParticipacao", () => {
  beforeEach(() => {
    mockRequererAcessoPainel.mockReset();
    mockParticipacaoDelete.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige acesso ao painel", async () => {
    mockRequererAcessoPainel.mockRejectedValue(new AppError("Acesso negado"));

    await expect(rejeitarParticipacao("p1")).rejects.toThrow("Acesso negado");
    expect(mockParticipacaoDelete).not.toHaveBeenCalled();
  });

  it("remove a participação e revalida as duas rotas, sem apagar foto quando não havia", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockParticipacaoDelete.mockResolvedValue({
      id: "p1",
      fotoChave: null,
      desafioSurpresa: { desafioId: "d1" },
    });

    await rejeitarParticipacao("p1");

    expect(mockParticipacaoDelete).toHaveBeenCalledWith({
      where: { id: "p1" },
      include: { desafioSurpresa: true },
    });
    expect(mockApagarObjeto).not.toHaveBeenCalled();
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/desafios/d1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/aprovacoes");
  });

  it("apaga a foto do R2 quando a participação rejeitada tinha comprovação", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockParticipacaoDelete.mockResolvedValue({
      id: "p1",
      fotoChave: "comprovantes-surpresa/cliente-1/abc.webp",
      desafioSurpresa: { desafioId: "d1" },
    });

    await rejeitarParticipacao("p1");

    expect(mockApagarObjeto).toHaveBeenCalledWith(
      "comprovantes-surpresa/cliente-1/abc.webp",
      expect.any(String),
    );
  });

  it("se o delete no banco falhar, não apaga o objeto", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockParticipacaoDelete.mockRejectedValue(new Error("falha no banco"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(rejeitarParticipacao("p1")).rejects.toThrow();

    expect(mockApagarObjeto).not.toHaveBeenCalled();
  });
});
