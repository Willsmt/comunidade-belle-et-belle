import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/actions/executar-action";

const {
  mockRequererAcessoPainel,
  mockCreateTipoSessao,
  mockUpdateTipoSessao,
  mockDeleteTipoSessao,
  mockCountTipoSessao,
  mockCreateTipoPacote,
  mockUpdateTipoPacote,
  mockDeleteTipoPacote,
  mockFindUniqueTipoPacote,
  mockCountItemTipoPacote,
  mockDeleteManyItemTipoPacote,
  mockCountItemCicloPacote,
  mockCountSessaoRealizada,
  mockCountCicloPacote,
  mockTransaction,
  mockRevalidatePath,
} = vi.hoisted(() => ({
  mockRequererAcessoPainel: vi.fn(),
  mockCreateTipoSessao: vi.fn(),
  mockUpdateTipoSessao: vi.fn(),
  mockDeleteTipoSessao: vi.fn(),
  mockCountTipoSessao: vi.fn(),
  mockCreateTipoPacote: vi.fn(),
  mockUpdateTipoPacote: vi.fn(),
  mockDeleteTipoPacote: vi.fn(),
  mockFindUniqueTipoPacote: vi.fn(),
  mockCountItemTipoPacote: vi.fn(),
  mockDeleteManyItemTipoPacote: vi.fn(),
  mockCountItemCicloPacote: vi.fn(),
  mockCountSessaoRealizada: vi.fn(),
  mockCountCicloPacote: vi.fn(),
  mockTransaction: vi.fn(),
  mockRevalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth/requerer-acesso-painel", () => ({
  requererAcessoPainel: mockRequererAcessoPainel,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tipoSessao: {
      create: mockCreateTipoSessao,
      update: mockUpdateTipoSessao,
      delete: mockDeleteTipoSessao,
      count: mockCountTipoSessao,
    },
    tipoPacote: {
      create: mockCreateTipoPacote,
      update: mockUpdateTipoPacote,
      delete: mockDeleteTipoPacote,
      findUnique: mockFindUniqueTipoPacote,
    },
    itemTipoPacote: { count: mockCountItemTipoPacote, deleteMany: mockDeleteManyItemTipoPacote },
    itemCicloPacote: { count: mockCountItemCicloPacote },
    sessaoRealizada: { count: mockCountSessaoRealizada },
    cicloPacote: { count: mockCountCicloPacote },
    $transaction: mockTransaction,
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));

import {
  criarTipoSessao,
  editarTipoSessao,
  excluirTipoSessao,
  reativarTipoSessao,
  criarTipoPacote,
  editarTipoPacote,
  excluirTipoPacote,
  reativarTipoPacote,
} from "./actions";

function buildFormData(campos: [string, string][]) {
  const formData = new FormData();
  for (const [chave, valor] of campos) {
    formData.append(chave, valor);
  }
  return formData;
}

describe("criarTipoSessao", () => {
  beforeEach(() => {
    mockRequererAcessoPainel.mockReset();
    mockCreateTipoSessao.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige acesso ao painel", async () => {
    mockRequererAcessoPainel.mockRejectedValue(new AppError("Acesso negado"));

    await expect(criarTipoSessao(buildFormData([["nome", "Aplicação"]]))).rejects.toThrow(
      "Acesso negado",
    );
    expect(mockCreateTipoSessao).not.toHaveBeenCalled();
  });

  it("rejeita nome vazio", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });

    await expect(criarTipoSessao(buildFormData([["nome", "  "]]))).rejects.toThrow(
      "Informe o nome do tipo de sessão",
    );
    expect(mockCreateTipoSessao).not.toHaveBeenCalled();
  });

  it("cria o tipo de sessão com o nome informado", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockCreateTipoSessao.mockResolvedValue({});

    await criarTipoSessao(buildFormData([["nome", "Aplicação"]]));

    expect(mockCreateTipoSessao).toHaveBeenCalledWith({ data: { nome: "Aplicação" } });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/pacotes");
  });

  it("rejeita nome duplicado com mensagem amigável", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockCreateTipoSessao.mockRejectedValue(new Error("Unique constraint failed"));

    await expect(
      criarTipoSessao(buildFormData([["nome", "Aplicação"]])),
    ).rejects.toThrow("Já existe um tipo de sessão com esse nome");
  });
});

describe("criarTipoPacote", () => {
  beforeEach(() => {
    mockRequererAcessoPainel.mockReset();
    mockCountTipoSessao.mockReset();
    mockCreateTipoPacote.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige acesso ao painel", async () => {
    mockRequererAcessoPainel.mockRejectedValue(new AppError("Acesso negado"));

    await expect(
      criarTipoPacote(buildFormData([["nome", "Projeto Corpo dos Sonhos"]])),
    ).rejects.toThrow("Acesso negado");
    expect(mockCreateTipoPacote).not.toHaveBeenCalled();
  });

  it("rejeita nome vazio", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });

    await expect(
      criarTipoPacote(buildFormData([["nome", ""], ["quantidade-ts1", "4"]])),
    ).rejects.toThrow("Informe o nome do tipo de pacote");
    expect(mockCreateTipoPacote).not.toHaveBeenCalled();
  });

  it("rejeita quando nenhum tipo de sessão tem quantidade preenchida", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });

    await expect(
      criarTipoPacote(buildFormData([["nome", "Projeto Corpo dos Sonhos"]])),
    ).rejects.toThrow("Selecione ao menos um tipo de sessão com quantidade");
    expect(mockCreateTipoPacote).not.toHaveBeenCalled();
  });

  it("rejeita quantidade menor que 1", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });

    await expect(
      criarTipoPacote(
        buildFormData([
          ["nome", "Projeto Corpo dos Sonhos"],
          ["quantidade-ts1", "0"],
        ]),
      ),
    ).rejects.toThrow(
      "A quantidade de cada tipo de sessão precisa ser 1 ou mais",
    );
    expect(mockCreateTipoPacote).not.toHaveBeenCalled();
  });

  it("rejeita tipo de sessão repetido", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });

    await expect(
      criarTipoPacote(
        buildFormData([
          ["nome", "Projeto Corpo dos Sonhos"],
          ["quantidade-ts1", "4"],
          ["quantidade-ts1", "2"],
        ]),
      ),
    ).rejects.toThrow("Cada tipo de sessão só pode aparecer uma vez no pacote");
    expect(mockCreateTipoPacote).not.toHaveBeenCalled();
  });

  it("rejeita tipo de sessão que não existe mais", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockCountTipoSessao.mockResolvedValue(0);

    await expect(
      criarTipoPacote(
        buildFormData([
          ["nome", "Projeto Corpo dos Sonhos"],
          ["quantidade-ts1", "4"],
        ]),
      ),
    ).rejects.toThrow("Um dos tipos de sessão selecionados não existe mais");
    expect(mockCreateTipoPacote).not.toHaveBeenCalled();
  });

  it("cria o tipo de pacote com os itens informados", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockCountTipoSessao.mockResolvedValue(3);
    mockCreateTipoPacote.mockResolvedValue({});

    await criarTipoPacote(
      buildFormData([
        ["nome", "Projeto Corpo dos Sonhos"],
        ["quantidade-ts1", "4"],
        ["quantidade-ts2", "4"],
        ["quantidade-ts3", "4"],
      ]),
    );

    expect(mockCreateTipoPacote).toHaveBeenCalledWith({
      data: {
        nome: "Projeto Corpo dos Sonhos",
        itens: {
          create: [
            { tipoSessaoId: "ts1", quantidade: 4 },
            { tipoSessaoId: "ts2", quantidade: 4 },
            { tipoSessaoId: "ts3", quantidade: 4 },
          ],
        },
      },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/pacotes");
  });
});

describe("editarTipoSessao", () => {
  beforeEach(() => {
    mockRequererAcessoPainel.mockReset();
    mockUpdateTipoSessao.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige acesso ao painel", async () => {
    mockRequererAcessoPainel.mockRejectedValue(new AppError("Acesso negado"));

    await expect(
      editarTipoSessao(buildFormData([["id", "ts1"], ["nome", "Aplicação"]])),
    ).rejects.toThrow("Acesso negado");
    expect(mockUpdateTipoSessao).not.toHaveBeenCalled();
  });

  it("rejeita nome vazio", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });

    await expect(
      editarTipoSessao(buildFormData([["id", "ts1"], ["nome", " "]])),
    ).rejects.toThrow("Informe o nome do tipo de sessão");
    expect(mockUpdateTipoSessao).not.toHaveBeenCalled();
  });

  it("atualiza o nome do tipo de sessão", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockUpdateTipoSessao.mockResolvedValue({});

    await editarTipoSessao(buildFormData([["id", "ts1"], ["nome", "Aplicação de Ácido"]]));

    expect(mockUpdateTipoSessao).toHaveBeenCalledWith({
      where: { id: "ts1" },
      data: { nome: "Aplicação de Ácido" },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/pacotes");
  });

  it("rejeita nome duplicado com mensagem amigável", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockUpdateTipoSessao.mockRejectedValue(new Error("Unique constraint failed"));

    await expect(
      editarTipoSessao(buildFormData([["id", "ts1"], ["nome", "Ultrassom"]])),
    ).rejects.toThrow("Já existe um tipo de sessão com esse nome");
  });
});

describe("excluirTipoSessao", () => {
  beforeEach(() => {
    mockRequererAcessoPainel.mockReset();
    mockCountItemTipoPacote.mockReset();
    mockCountItemCicloPacote.mockReset();
    mockCountSessaoRealizada.mockReset();
    mockUpdateTipoSessao.mockReset();
    mockDeleteTipoSessao.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige acesso ao painel", async () => {
    mockRequererAcessoPainel.mockRejectedValue(new AppError("Acesso negado"));

    await expect(excluirTipoSessao("ts1")).rejects.toThrow("Acesso negado");
    expect(mockDeleteTipoSessao).not.toHaveBeenCalled();
    expect(mockUpdateTipoSessao).not.toHaveBeenCalled();
  });

  it("apaga de verdade quando nunca foi usado em nenhum lugar", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockCountItemTipoPacote.mockResolvedValue(0);
    mockCountItemCicloPacote.mockResolvedValue(0);
    mockCountSessaoRealizada.mockResolvedValue(0);
    mockDeleteTipoSessao.mockResolvedValue({});

    await excluirTipoSessao("ts1");

    expect(mockDeleteTipoSessao).toHaveBeenCalledWith({ where: { id: "ts1" } });
    expect(mockUpdateTipoSessao).not.toHaveBeenCalled();
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/pacotes");
  });

  it("arquiva em vez de apagar quando já está na composição de algum tipo de pacote", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockCountItemTipoPacote.mockResolvedValue(1);
    mockCountItemCicloPacote.mockResolvedValue(0);
    mockCountSessaoRealizada.mockResolvedValue(0);
    mockUpdateTipoSessao.mockResolvedValue({});

    await excluirTipoSessao("ts1");

    expect(mockUpdateTipoSessao).toHaveBeenCalledWith({
      where: { id: "ts1" },
      data: { ativo: false },
    });
    expect(mockDeleteTipoSessao).not.toHaveBeenCalled();
  });

  it("arquiva em vez de apagar quando já tem sessão realizada marcada", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockCountItemTipoPacote.mockResolvedValue(0);
    mockCountItemCicloPacote.mockResolvedValue(0);
    mockCountSessaoRealizada.mockResolvedValue(1);
    mockUpdateTipoSessao.mockResolvedValue({});

    await excluirTipoSessao("ts1");

    expect(mockUpdateTipoSessao).toHaveBeenCalledWith({
      where: { id: "ts1" },
      data: { ativo: false },
    });
    expect(mockDeleteTipoSessao).not.toHaveBeenCalled();
  });
});

describe("reativarTipoSessao", () => {
  beforeEach(() => {
    mockRequererAcessoPainel.mockReset();
    mockUpdateTipoSessao.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige acesso ao painel", async () => {
    mockRequererAcessoPainel.mockRejectedValue(new AppError("Acesso negado"));

    await expect(reativarTipoSessao("ts1")).rejects.toThrow("Acesso negado");
    expect(mockUpdateTipoSessao).not.toHaveBeenCalled();
  });

  it("marca o tipo de sessão como ativo de novo", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockUpdateTipoSessao.mockResolvedValue({});

    await reativarTipoSessao("ts1");

    expect(mockUpdateTipoSessao).toHaveBeenCalledWith({
      where: { id: "ts1" },
      data: { ativo: true },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/pacotes");
  });
});

describe("editarTipoPacote", () => {
  beforeEach(() => {
    mockRequererAcessoPainel.mockReset();
    mockCountTipoSessao.mockReset();
    mockFindUniqueTipoPacote.mockReset();
    mockTransaction.mockReset();
    mockDeleteManyItemTipoPacote.mockReset();
    mockUpdateTipoPacote.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige acesso ao painel", async () => {
    mockRequererAcessoPainel.mockRejectedValue(new AppError("Acesso negado"));

    await expect(
      editarTipoPacote(
        buildFormData([["id", "tp1"], ["nome", "Novo nome"], ["quantidade-ts1", "4"]]),
      ),
    ).rejects.toThrow("Acesso negado");
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("rejeita tipo de pacote inexistente", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockCountTipoSessao.mockResolvedValue(1);
    mockFindUniqueTipoPacote.mockResolvedValue(null);

    await expect(
      editarTipoPacote(
        buildFormData([["id", "tp-inexistente"], ["nome", "Novo nome"], ["quantidade-ts1", "4"]]),
      ),
    ).rejects.toThrow("Tipo de pacote não encontrado");
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("substitui a composição e atualiza o nome numa transação", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockCountTipoSessao.mockResolvedValue(2);
    mockFindUniqueTipoPacote.mockResolvedValue({ id: "tp1" });
    mockDeleteManyItemTipoPacote.mockReturnValue("deleteMany-op");
    mockUpdateTipoPacote.mockReturnValue("update-op");
    mockTransaction.mockResolvedValue([{}, {}]);

    await editarTipoPacote(
      buildFormData([
        ["id", "tp1"],
        ["nome", "Projeto Corpo dos Sonhos 2"],
        ["quantidade-ts1", "6"],
        ["quantidade-ts2", "6"],
      ]),
    );

    expect(mockDeleteManyItemTipoPacote).toHaveBeenCalledWith({
      where: { tipoPacoteId: "tp1" },
    });
    expect(mockUpdateTipoPacote).toHaveBeenCalledWith({
      where: { id: "tp1" },
      data: {
        nome: "Projeto Corpo dos Sonhos 2",
        itens: {
          create: [
            { tipoSessaoId: "ts1", quantidade: 6 },
            { tipoSessaoId: "ts2", quantidade: 6 },
          ],
        },
      },
    });
    expect(mockTransaction).toHaveBeenCalledWith(["deleteMany-op", "update-op"]);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/pacotes");
  });
});

describe("excluirTipoPacote", () => {
  beforeEach(() => {
    mockRequererAcessoPainel.mockReset();
    mockCountCicloPacote.mockReset();
    mockUpdateTipoPacote.mockReset();
    mockDeleteTipoPacote.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige acesso ao painel", async () => {
    mockRequererAcessoPainel.mockRejectedValue(new AppError("Acesso negado"));

    await expect(excluirTipoPacote("tp1")).rejects.toThrow("Acesso negado");
    expect(mockDeleteTipoPacote).not.toHaveBeenCalled();
  });

  it("apaga de verdade quando nunca foi vinculado a nenhuma cliente", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockCountCicloPacote.mockResolvedValue(0);
    mockDeleteTipoPacote.mockResolvedValue({});

    await excluirTipoPacote("tp1");

    expect(mockDeleteTipoPacote).toHaveBeenCalledWith({ where: { id: "tp1" } });
    expect(mockUpdateTipoPacote).not.toHaveBeenCalled();
  });

  it("arquiva em vez de apagar quando já foi vinculado a alguma cliente", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockCountCicloPacote.mockResolvedValue(2);
    mockUpdateTipoPacote.mockResolvedValue({});

    await excluirTipoPacote("tp1");

    expect(mockUpdateTipoPacote).toHaveBeenCalledWith({
      where: { id: "tp1" },
      data: { ativo: false },
    });
    expect(mockDeleteTipoPacote).not.toHaveBeenCalled();
  });
});

describe("reativarTipoPacote", () => {
  beforeEach(() => {
    mockRequererAcessoPainel.mockReset();
    mockUpdateTipoPacote.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige acesso ao painel", async () => {
    mockRequererAcessoPainel.mockRejectedValue(new AppError("Acesso negado"));

    await expect(reativarTipoPacote("tp1")).rejects.toThrow("Acesso negado");
    expect(mockUpdateTipoPacote).not.toHaveBeenCalled();
  });

  it("marca o tipo de pacote como ativo de novo", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockUpdateTipoPacote.mockResolvedValue({});

    await reativarTipoPacote("tp1");

    expect(mockUpdateTipoPacote).toHaveBeenCalledWith({
      where: { id: "tp1" },
      data: { ativo: true },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/pacotes");
  });
});
