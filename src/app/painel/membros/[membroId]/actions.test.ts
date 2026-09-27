import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/actions/executar-action";

const {
  mockRequererAcessoPainel,
  mockFindUniqueTipoPacote,
  mockTransaction,
  mockFindUniqueCicloPacote,
  mockUpdateManyCicloPacote,
  mockCreateCicloPacote,
  mockFindUniqueItemCicloPacote,
  mockCountSessaoRealizada,
  mockCreateSessaoRealizada,
  mockFindUniqueSessaoRealizada,
  mockDeleteSessaoRealizada,
  mockRevalidatePath,
  mockObterDataDeHoje,
} = vi.hoisted(() => ({
  mockRequererAcessoPainel: vi.fn(),
  mockFindUniqueTipoPacote: vi.fn(),
  mockTransaction: vi.fn(),
  mockFindUniqueCicloPacote: vi.fn(),
  mockUpdateManyCicloPacote: vi.fn(),
  mockCreateCicloPacote: vi.fn(),
  mockFindUniqueItemCicloPacote: vi.fn(),
  mockCountSessaoRealizada: vi.fn(),
  mockCreateSessaoRealizada: vi.fn(),
  mockFindUniqueSessaoRealizada: vi.fn(),
  mockDeleteSessaoRealizada: vi.fn(),
  mockRevalidatePath: vi.fn(),
  mockObterDataDeHoje: vi.fn(),
}));

vi.mock("@/lib/auth/requerer-acesso-painel", () => ({
  requererAcessoPainel: mockRequererAcessoPainel,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tipoPacote: { findUnique: mockFindUniqueTipoPacote },
    cicloPacote: {
      findUnique: mockFindUniqueCicloPacote,
      updateMany: mockUpdateManyCicloPacote,
      create: mockCreateCicloPacote,
    },
    itemCicloPacote: { findUnique: mockFindUniqueItemCicloPacote },
    sessaoRealizada: {
      count: mockCountSessaoRealizada,
      create: mockCreateSessaoRealizada,
      findUnique: mockFindUniqueSessaoRealizada,
      delete: mockDeleteSessaoRealizada,
    },
    $transaction: mockTransaction,
  },
}));
vi.mock("@/lib/hoje", () => ({ obterDataDeHoje: mockObterDataDeHoje }));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));

import { vincularPacote, marcarSessaoRealizada, desfazerSessaoRealizada } from "./actions";

describe("vincularPacote", () => {
  beforeEach(() => {
    mockRequererAcessoPainel.mockReset();
    mockFindUniqueTipoPacote.mockReset();
    mockTransaction.mockReset();
    mockUpdateManyCicloPacote.mockReset();
    mockCreateCicloPacote.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige acesso ao painel", async () => {
    mockRequererAcessoPainel.mockRejectedValue(new AppError("Acesso negado"));

    await expect(vincularPacote("cliente-1", "tp1")).rejects.toThrow("Acesso negado");
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("rejeita tipo de pacote inexistente", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockFindUniqueTipoPacote.mockResolvedValue(null);

    await expect(vincularPacote("cliente-1", "tp-inexistente")).rejects.toThrow(
      "Tipo de pacote não encontrado",
    );
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("arquiva o ciclo ativo anterior e cria um novo ciclo com a composição copiada", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockFindUniqueTipoPacote.mockResolvedValue({
      id: "tp1",
      nome: "Projeto Corpo dos Sonhos",
      itens: [
        { tipoSessaoId: "ts1", quantidade: 4 },
        { tipoSessaoId: "ts2", quantidade: 4 },
      ],
    });
    mockUpdateManyCicloPacote.mockReturnValue("updateMany-op");
    mockCreateCicloPacote.mockReturnValue("create-op");
    mockTransaction.mockResolvedValue([{}, {}]);

    await vincularPacote("cliente-1", "tp1");

    expect(mockUpdateManyCicloPacote).toHaveBeenCalledWith({
      where: { clienteId: "cliente-1", ativo: true },
      data: { ativo: false, arquivadoEm: expect.any(Date) },
    });
    expect(mockCreateCicloPacote).toHaveBeenCalledWith({
      data: {
        clienteId: "cliente-1",
        tipoPacoteId: "tp1",
        nomePacote: "Projeto Corpo dos Sonhos",
        ativo: true,
        itens: {
          create: [
            { tipoSessaoId: "ts1", quantidadeContratada: 4 },
            { tipoSessaoId: "ts2", quantidadeContratada: 4 },
          ],
        },
      },
    });
    expect(mockTransaction).toHaveBeenCalledWith(["updateMany-op", "create-op"]);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/membros/cliente-1");
  });
});

describe("marcarSessaoRealizada", () => {
  beforeEach(() => {
    mockRequererAcessoPainel.mockReset();
    mockFindUniqueCicloPacote.mockReset();
    mockFindUniqueItemCicloPacote.mockReset();
    mockCountSessaoRealizada.mockReset();
    mockCreateSessaoRealizada.mockReset();
    mockObterDataDeHoje.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige acesso ao painel", async () => {
    mockRequererAcessoPainel.mockRejectedValue(new AppError("Acesso negado"));

    await expect(marcarSessaoRealizada("ciclo-1", "ts1")).rejects.toThrow("Acesso negado");
    expect(mockCreateSessaoRealizada).not.toHaveBeenCalled();
  });

  it("rejeita ciclo que não está mais ativo", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockFindUniqueCicloPacote.mockResolvedValue({
      id: "ciclo-1",
      clienteId: "cliente-1",
      ativo: false,
    });

    await expect(marcarSessaoRealizada("ciclo-1", "ts1")).rejects.toThrow(
      "Este ciclo não está mais ativo",
    );
    expect(mockCreateSessaoRealizada).not.toHaveBeenCalled();
  });

  it("rejeita tipo de sessão que não faz parte do ciclo", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockFindUniqueCicloPacote.mockResolvedValue({
      id: "ciclo-1",
      clienteId: "cliente-1",
      ativo: true,
    });
    mockFindUniqueItemCicloPacote.mockResolvedValue(null);

    await expect(marcarSessaoRealizada("ciclo-1", "ts-fora")).rejects.toThrow(
      "Este tipo de sessão não faz parte do pacote deste ciclo",
    );
    expect(mockCreateSessaoRealizada).not.toHaveBeenCalled();
  });

  it("bloqueia ao atingir a quantidade contratada", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockFindUniqueCicloPacote.mockResolvedValue({
      id: "ciclo-1",
      clienteId: "cliente-1",
      ativo: true,
    });
    mockFindUniqueItemCicloPacote.mockResolvedValue({ quantidadeContratada: 4 });
    mockCountSessaoRealizada.mockResolvedValue(4);

    await expect(marcarSessaoRealizada("ciclo-1", "ts1")).rejects.toThrow(
      "O limite do pacote para esse tipo de sessão já foi cumprido",
    );
    expect(mockCreateSessaoRealizada).not.toHaveBeenCalled();
  });

  it("cria a sessão realizada com a data de hoje quando data não é informada", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockFindUniqueCicloPacote.mockResolvedValue({
      id: "ciclo-1",
      clienteId: "cliente-1",
      ativo: true,
    });
    mockFindUniqueItemCicloPacote.mockResolvedValue({ quantidadeContratada: 4 });
    mockCountSessaoRealizada.mockResolvedValue(2);
    mockObterDataDeHoje.mockReturnValue(new Date("2026-09-27T00:00:00.000Z"));
    mockCreateSessaoRealizada.mockResolvedValue({});

    await marcarSessaoRealizada("ciclo-1", "ts1");

    expect(mockCreateSessaoRealizada).toHaveBeenCalledWith({
      data: {
        cicloPacoteId: "ciclo-1",
        tipoSessaoId: "ts1",
        data: new Date("2026-09-27T00:00:00.000Z"),
        marcadoPorId: "patty-1",
      },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/membros/cliente-1");
  });

  it("usa a data informada quando fornecida", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockFindUniqueCicloPacote.mockResolvedValue({
      id: "ciclo-1",
      clienteId: "cliente-1",
      ativo: true,
    });
    mockFindUniqueItemCicloPacote.mockResolvedValue({ quantidadeContratada: 4 });
    mockCountSessaoRealizada.mockResolvedValue(0);
    mockCreateSessaoRealizada.mockResolvedValue({});

    await marcarSessaoRealizada("ciclo-1", "ts1", "2026-08-01");

    expect(mockCreateSessaoRealizada).toHaveBeenCalledWith({
      data: {
        cicloPacoteId: "ciclo-1",
        tipoSessaoId: "ts1",
        data: new Date("2026-08-01"),
        marcadoPorId: "patty-1",
      },
    });
    expect(mockObterDataDeHoje).not.toHaveBeenCalled();
  });
});

describe("desfazerSessaoRealizada", () => {
  beforeEach(() => {
    mockRequererAcessoPainel.mockReset();
    mockFindUniqueSessaoRealizada.mockReset();
    mockDeleteSessaoRealizada.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige acesso ao painel", async () => {
    mockRequererAcessoPainel.mockRejectedValue(new AppError("Acesso negado"));

    await expect(desfazerSessaoRealizada("sr1")).rejects.toThrow("Acesso negado");
    expect(mockDeleteSessaoRealizada).not.toHaveBeenCalled();
  });

  it("rejeita sessão inexistente", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockFindUniqueSessaoRealizada.mockResolvedValue(null);

    await expect(desfazerSessaoRealizada("sr-inexistente")).rejects.toThrow(
      "Sessão não encontrada",
    );
    expect(mockDeleteSessaoRealizada).not.toHaveBeenCalled();
  });

  it("remove a sessão e revalida a página do cliente", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockFindUniqueSessaoRealizada.mockResolvedValue({
      id: "sr1",
      cicloPacote: { clienteId: "cliente-1" },
    });
    mockDeleteSessaoRealizada.mockResolvedValue({});

    await desfazerSessaoRealizada("sr1");

    expect(mockDeleteSessaoRealizada).toHaveBeenCalledWith({ where: { id: "sr1" } });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/membros/cliente-1");
  });
});
