import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/actions/executar-action";

const {
  mockRequererAcesso,
  mockUpdate,
  mockDelete,
  mockUpsert,
  mockTransaction,
  mockMarcacaoFindUniqueOrThrow,
  mockMarcacaoUpdate,
  mockMarcacaoDelete,
  mockApagarObjeto,
  mockVerificarConquistasBonus,
  mockVerificarConquistasRankingSemanal,
  mockRevalidatePath,
} = vi.hoisted(() => ({
  mockRequererAcesso: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
  mockUpsert: vi.fn(),
  mockTransaction: vi.fn(),
  mockMarcacaoFindUniqueOrThrow: vi.fn(),
  mockMarcacaoUpdate: vi.fn(),
  mockMarcacaoDelete: vi.fn(),
  mockApagarObjeto: vi.fn(),
  mockVerificarConquistasBonus: vi.fn(),
  mockVerificarConquistasRankingSemanal: vi.fn(),
  mockRevalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth/requerer-acesso-painel", () => ({
  requererAcessoPainel: mockRequererAcesso,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { update: mockUpdate, delete: mockDelete },
    usuarioPapel: { upsert: mockUpsert },
    marcacaoItem: {
      findUniqueOrThrow: mockMarcacaoFindUniqueOrThrow,
      update: mockMarcacaoUpdate,
      delete: mockMarcacaoDelete,
    },
    $transaction: mockTransaction,
  },
}));
vi.mock("@/lib/storage/objetos", () => ({
  apagarObjetoEmMelhorEsforco: mockApagarObjeto,
}));
vi.mock("@/lib/desafios/conquistas", () => ({
  verificarConquistasBonus: mockVerificarConquistasBonus,
  verificarConquistasRankingSemanal: mockVerificarConquistasRankingSemanal,
}));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));

import { aprovarConta, rejeitarConta, aprovarMarcacaoItem, rejeitarMarcacaoItem } from "./actions";

describe("aprovarConta", () => {
  beforeEach(() => {
    mockRequererAcesso.mockReset();
    mockUpdate.mockReset();
    mockUpsert.mockReset();
    mockTransaction.mockReset();
    mockRevalidatePath.mockReset();
    mockTransaction.mockImplementation((ops: Promise<unknown>[]) =>
      Promise.all(ops),
    );
  });

  it("nega e não atualiza nada se o acesso for negado", async () => {
    mockRequererAcesso.mockRejectedValue(new AppError("Acesso negado"));
    await expect(aprovarConta("user-1")).rejects.toThrow("Acesso negado");
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("aprova, registra quem aprovou e atribui o papel CLIENTE, na mesma transação", async () => {
    mockRequererAcesso.mockResolvedValue({ user: { id: "patty-1" } });
    mockUpdate.mockResolvedValue({});
    mockUpsert.mockResolvedValue({});

    await aprovarConta("user-1");

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        status: "ATIVO",
        aprovadoPor: "patty-1",
        aprovadoEm: expect.any(Date),
      },
    });
    expect(mockUpsert).toHaveBeenCalledWith({
      where: { userId_papel: { userId: "user-1", papel: "CLIENTE" } },
      create: { userId: "user-1", papel: "CLIENTE" },
      update: {},
    });
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/aprovacoes");
  });

  it("é idempotente: não duplica o papel CLIENTE se o usuário já tiver (upsert)", async () => {
    mockRequererAcesso.mockResolvedValue({ user: { id: "patty-1" } });
    mockUpdate.mockResolvedValue({});
    mockUpsert.mockResolvedValue({});

    await aprovarConta("user-1");

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: {} }),
    );
  });
});

describe("rejeitarConta", () => {
  beforeEach(() => {
    mockRequererAcesso.mockReset();
    mockDelete.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("nega e não deleta nada se o acesso for negado", async () => {
    mockRequererAcesso.mockRejectedValue(new AppError("Acesso negado"));
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

describe("aprovarMarcacaoItem", () => {
  beforeEach(() => {
    mockRequererAcesso.mockReset();
    mockMarcacaoFindUniqueOrThrow.mockReset();
    mockMarcacaoUpdate.mockReset();
    mockApagarObjeto.mockReset().mockResolvedValue(undefined);
    mockApagarObjeto.mockReset();
    mockVerificarConquistasBonus.mockReset();
    mockVerificarConquistasRankingSemanal.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige acesso ao painel", async () => {
    mockRequererAcesso.mockRejectedValue(new AppError("Acesso negado"));

    await expect(aprovarMarcacaoItem("m1")).rejects.toThrow("Acesso negado");
    expect(mockMarcacaoUpdate).not.toHaveBeenCalled();
  });

  it("rejeita marcação já aprovada", async () => {
    mockRequererAcesso.mockResolvedValue({ user: { id: "patty-1" } });
    mockMarcacaoFindUniqueOrThrow.mockResolvedValue({
      id: "m1",
      validado: true,
      clienteId: "cliente-1",
      data: new Date("2026-09-05"),
      fotoChave: null,
      item: { categoria: { desafioId: "d1" } },
    });

    await expect(aprovarMarcacaoItem("m1")).rejects.toThrow(
      "Essa marcação já foi aprovada",
    );
    expect(mockMarcacaoUpdate).not.toHaveBeenCalled();
  });

  it("aprova, apaga a foto do R2 e verifica conquistas com a data original da marcação", async () => {
    mockRequererAcesso.mockResolvedValue({ user: { id: "patty-1" } });
    mockMarcacaoFindUniqueOrThrow.mockResolvedValue({
      id: "m1",
      validado: false,
      clienteId: "cliente-1",
      data: new Date("2026-09-05"),
      fotoChave: "comprovantes-item/cliente-1/abc.webp",
      item: { categoria: { desafioId: "d1" } },
    });
    mockMarcacaoUpdate.mockResolvedValue({});

    await aprovarMarcacaoItem("m1");

    expect(mockMarcacaoUpdate).toHaveBeenCalledWith({
      where: { id: "m1" },
      data: {
        validado: true,
        validadoPor: "patty-1",
        validadoEm: expect.any(Date),
        fotoChave: null,
      },
    });
    expect(mockApagarObjeto).toHaveBeenCalledWith(
      "comprovantes-item/cliente-1/abc.webp",
      expect.any(String),
    );
    expect(mockVerificarConquistasBonus).toHaveBeenCalledWith(
      "cliente-1",
      "d1",
      new Date("2026-09-05"),
    );
    expect(mockVerificarConquistasRankingSemanal).toHaveBeenCalledWith(
      "d1",
      new Date("2026-09-05"),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/aprovacoes");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/cliente/desafios");
  });

  it("grava fotoChave null na escrita e só depois apaga o objeto", async () => {
    mockRequererAcesso.mockResolvedValue({ user: { id: "patty-1" } });
    mockMarcacaoFindUniqueOrThrow.mockResolvedValue({
      id: "m1",
      validado: false,
      clienteId: "cliente-1",
      data: new Date("2026-09-05"),
      fotoChave: "comprovantes-item/cliente-1/abc.webp",
      item: { categoria: { desafioId: "d1" } },
    });
    const ordem: string[] = [];
    mockMarcacaoUpdate.mockImplementation(async () => {
      ordem.push("banco");
    });
    mockApagarObjeto.mockImplementation(async () => {
      ordem.push("r2");
    });

    await aprovarMarcacaoItem("m1");

    expect(mockMarcacaoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ fotoChave: null }),
      }),
    );
    expect(ordem).toEqual(["banco", "r2"]);
  });

  it("não apaga foto quando a marcação não tinha nenhuma", async () => {
    mockRequererAcesso.mockResolvedValue({ user: { id: "patty-1" } });
    mockMarcacaoFindUniqueOrThrow.mockResolvedValue({
      id: "m1",
      validado: false,
      clienteId: "cliente-1",
      data: new Date("2026-09-05"),
      fotoChave: null,
      item: { categoria: { desafioId: "d1" } },
    });
    mockMarcacaoUpdate.mockResolvedValue({});

    await aprovarMarcacaoItem("m1");

    expect(mockApagarObjeto).not.toHaveBeenCalled();
  });
});

describe("rejeitarMarcacaoItem", () => {
  beforeEach(() => {
    mockRequererAcesso.mockReset();
    mockMarcacaoFindUniqueOrThrow.mockReset();
    mockMarcacaoDelete.mockReset();
    mockApagarObjeto.mockReset().mockResolvedValue(undefined);
    mockRevalidatePath.mockReset();
  });

  it("exige acesso ao painel", async () => {
    mockRequererAcesso.mockRejectedValue(new AppError("Acesso negado"));

    await expect(rejeitarMarcacaoItem("m1")).rejects.toThrow("Acesso negado");
    expect(mockMarcacaoDelete).not.toHaveBeenCalled();
  });

  it("remove a marcação e depois apaga a foto do R2, revalidando as duas rotas", async () => {
    mockRequererAcesso.mockResolvedValue({ user: { id: "patty-1" } });
    mockMarcacaoFindUniqueOrThrow.mockResolvedValue({
      id: "m1",
      fotoChave: "comprovantes-item/cliente-1/abc.webp",
    });
    mockMarcacaoDelete.mockResolvedValue({});

    await rejeitarMarcacaoItem("m1");

    expect(mockApagarObjeto).toHaveBeenCalledWith(
      "comprovantes-item/cliente-1/abc.webp",
      expect.any(String),
    );
    expect(mockMarcacaoDelete).toHaveBeenCalledWith({ where: { id: "m1" } });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/painel/aprovacoes");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/cliente/desafios");
  });

  it("apaga no banco antes do R2", async () => {
    mockRequererAcesso.mockResolvedValue({ user: { id: "patty-1" } });
    mockMarcacaoFindUniqueOrThrow.mockResolvedValue({
      id: "m1",
      fotoChave: "comprovantes-item/cliente-1/abc.webp",
    });
    const ordem: string[] = [];
    mockMarcacaoDelete.mockImplementation(async () => {
      ordem.push("banco");
    });
    mockApagarObjeto.mockImplementation(async () => {
      ordem.push("r2");
    });

    await rejeitarMarcacaoItem("m1");

    expect(ordem).toEqual(["banco", "r2"]);
  });

  it("se o delete no banco falhar, não apaga o objeto", async () => {
    mockRequererAcesso.mockResolvedValue({ user: { id: "patty-1" } });
    mockMarcacaoFindUniqueOrThrow.mockResolvedValue({
      id: "m1",
      fotoChave: "comprovantes-item/cliente-1/abc.webp",
    });
    mockMarcacaoDelete.mockRejectedValue(new Error("falha no banco"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(rejeitarMarcacaoItem("m1")).rejects.toThrow();

    expect(mockApagarObjeto).not.toHaveBeenCalled();
  });

  it("não apaga foto quando a marcação não tinha nenhuma", async () => {
    mockRequererAcesso.mockResolvedValue({ user: { id: "patty-1" } });
    mockMarcacaoFindUniqueOrThrow.mockResolvedValue({ id: "m1", fotoChave: null });
    mockMarcacaoDelete.mockResolvedValue({});

    await rejeitarMarcacaoItem("m1");

    expect(mockApagarObjeto).not.toHaveBeenCalled();
  });
});
