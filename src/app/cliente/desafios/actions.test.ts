import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRequererPapel,
  mockItemFindUniqueOrThrow,
  mockMarcacaoFindUnique,
  mockMarcacaoCreate,
  mockMarcacaoDelete,
  mockSurpresaFindUniqueOrThrow,
  mockParticipacaoFindUnique,
  mockParticipacaoCreate,
  mockUploadComprovante,
  mockVerificarConquistasBonus,
  mockVerificarConquistasRankingSemanal,
  mockRevalidatePath,
} = vi.hoisted(() => ({
  mockRequererPapel: vi.fn(),
  mockItemFindUniqueOrThrow: vi.fn(),
  mockMarcacaoFindUnique: vi.fn(),
  mockMarcacaoCreate: vi.fn(),
  mockMarcacaoDelete: vi.fn(),
  mockSurpresaFindUniqueOrThrow: vi.fn(),
  mockParticipacaoFindUnique: vi.fn(),
  mockParticipacaoCreate: vi.fn(),
  mockUploadComprovante: vi.fn(),
  mockVerificarConquistasBonus: vi.fn(),
  mockVerificarConquistasRankingSemanal: vi.fn(),
  mockRevalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth/requerer-acesso-painel", () => ({
  requererPapel: mockRequererPapel,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    itemDesafio: { findUniqueOrThrow: mockItemFindUniqueOrThrow },
    marcacaoItem: {
      findUnique: mockMarcacaoFindUnique,
      create: mockMarcacaoCreate,
      delete: mockMarcacaoDelete,
    },
    desafioSurpresa: { findUniqueOrThrow: mockSurpresaFindUniqueOrThrow },
    participacaoSurpresa: {
      findUnique: mockParticipacaoFindUnique,
      create: mockParticipacaoCreate,
    },
  },
}));
vi.mock("@/lib/storage/comprovantes-surpresa", () => ({
  uploadComprovante: mockUploadComprovante,
}));
vi.mock("@/lib/desafios/conquistas", () => ({
  verificarConquistasBonus: mockVerificarConquistasBonus,
  verificarConquistasRankingSemanal: mockVerificarConquistasRankingSemanal,
}));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));

import { alternarMarcacao, participarDesafioSurpresa } from "./actions";

describe("alternarMarcacao", () => {
  beforeEach(() => {
    mockRequererPapel.mockReset();
    mockItemFindUniqueOrThrow.mockReset();
    mockMarcacaoFindUnique.mockReset();
    mockMarcacaoCreate.mockReset();
    mockMarcacaoDelete.mockReset();
    mockVerificarConquistasBonus.mockReset();
    mockVerificarConquistasRankingSemanal.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige papel CLIENTE", async () => {
    mockRequererPapel.mockRejectedValue(new Error("Acesso negado"));

    await expect(alternarMarcacao("i1")).rejects.toThrow("Acesso negado");
    expect(mockItemFindUniqueOrThrow).not.toHaveBeenCalled();
  });

  it("cria a marcação e verifica conquistas de bônus e semanal quando ainda não existe pra hoje", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "cliente-1" } });
    mockItemFindUniqueOrThrow.mockResolvedValue({ id: "i1", categoria: { desafioId: "d1" } });
    mockMarcacaoFindUnique.mockResolvedValue(null);
    mockMarcacaoCreate.mockResolvedValue({});

    await alternarMarcacao("i1");

    expect(mockMarcacaoCreate).toHaveBeenCalledWith({
      data: { itemId: "i1", clienteId: "cliente-1", data: expect.any(Date) },
    });
    expect(mockMarcacaoDelete).not.toHaveBeenCalled();
    expect(mockVerificarConquistasBonus).toHaveBeenCalledWith(
      "cliente-1",
      "d1",
      expect.any(Date),
    );
    expect(mockVerificarConquistasRankingSemanal).toHaveBeenCalledWith(
      "d1",
      expect.any(Date),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/cliente/desafios");
  });

  it("remove a marcação e NÃO verifica conquistas de bônus quando já existe pra hoje", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "cliente-1" } });
    mockItemFindUniqueOrThrow.mockResolvedValue({ id: "i1", categoria: { desafioId: "d1" } });
    mockMarcacaoFindUnique.mockResolvedValue({ id: "m1" });
    mockMarcacaoDelete.mockResolvedValue({});

    await alternarMarcacao("i1");

    expect(mockMarcacaoDelete).toHaveBeenCalledWith({ where: { id: "m1" } });
    expect(mockMarcacaoCreate).not.toHaveBeenCalled();
    expect(mockVerificarConquistasBonus).not.toHaveBeenCalled();
    expect(mockVerificarConquistasRankingSemanal).toHaveBeenCalledWith(
      "d1",
      expect.any(Date),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/cliente/desafios");
  });

  it("propaga erro se o item não existir", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "cliente-1" } });
    mockItemFindUniqueOrThrow.mockRejectedValue(new Error("Registro não encontrado"));

    await expect(alternarMarcacao("i-inexistente")).rejects.toThrow();
    expect(mockMarcacaoFindUnique).not.toHaveBeenCalled();
  });
});

function buildFormDataComArquivo(arquivo?: File) {
  const formData = new FormData();
  if (arquivo) {
    formData.set("comprovacao", arquivo);
  }
  return formData;
}

describe("participarDesafioSurpresa", () => {
  beforeEach(() => {
    mockRequererPapel.mockReset();
    mockSurpresaFindUniqueOrThrow.mockReset();
    mockParticipacaoFindUnique.mockReset();
    mockParticipacaoCreate.mockReset();
    mockUploadComprovante.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige papel CLIENTE", async () => {
    mockRequererPapel.mockRejectedValue(new Error("Acesso negado"));

    await expect(
      participarDesafioSurpresa("s1", buildFormDataComArquivo()),
    ).rejects.toThrow("Acesso negado");
    expect(mockSurpresaFindUniqueOrThrow).not.toHaveBeenCalled();
  });

  it("rejeita se já participou", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "cliente-1" } });
    mockSurpresaFindUniqueOrThrow.mockResolvedValue({
      id: "s1",
      exigeComprovacao: false,
    });
    mockParticipacaoFindUnique.mockResolvedValue({ id: "p1" });

    await expect(
      participarDesafioSurpresa("s1", buildFormDataComArquivo()),
    ).rejects.toThrow("Você já participou desse desafio surpresa");
    expect(mockParticipacaoCreate).not.toHaveBeenCalled();
  });

  it("rejeita sem arquivo quando exige comprovação", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "cliente-1" } });
    mockSurpresaFindUniqueOrThrow.mockResolvedValue({
      id: "s1",
      exigeComprovacao: true,
    });
    mockParticipacaoFindUnique.mockResolvedValue(null);

    await expect(
      participarDesafioSurpresa("s1", buildFormDataComArquivo()),
    ).rejects.toThrow("Envie a foto de comprovação");
    expect(mockUploadComprovante).not.toHaveBeenCalled();
    expect(mockParticipacaoCreate).not.toHaveBeenCalled();
  });

  it("cria a participação sem foto quando não exige comprovação", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "cliente-1" } });
    mockSurpresaFindUniqueOrThrow.mockResolvedValue({
      id: "s1",
      exigeComprovacao: false,
    });
    mockParticipacaoFindUnique.mockResolvedValue(null);
    mockParticipacaoCreate.mockResolvedValue({});

    await participarDesafioSurpresa("s1", buildFormDataComArquivo());

    expect(mockUploadComprovante).not.toHaveBeenCalled();
    expect(mockParticipacaoCreate).toHaveBeenCalledWith({
      data: { desafioSurpresaId: "s1", clienteId: "cliente-1", fotoChave: null },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/cliente/desafios");
  });

  it("faz upload da comprovação e cria a participação com a chave", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "cliente-1" } });
    mockSurpresaFindUniqueOrThrow.mockResolvedValue({
      id: "s1",
      exigeComprovacao: true,
    });
    mockParticipacaoFindUnique.mockResolvedValue(null);
    mockUploadComprovante.mockResolvedValue("comprovantes-surpresa/cliente-1/abc.webp");
    mockParticipacaoCreate.mockResolvedValue({});

    const arquivo = new File(["conteudo"], "foto.png", { type: "image/png" });

    await participarDesafioSurpresa("s1", buildFormDataComArquivo(arquivo));

    expect(mockUploadComprovante).toHaveBeenCalledWith(arquivo, "cliente-1");
    expect(mockParticipacaoCreate).toHaveBeenCalledWith({
      data: {
        desafioSurpresaId: "s1",
        clienteId: "cliente-1",
        fotoChave: "comprovantes-surpresa/cliente-1/abc.webp",
      },
    });
  });
});
