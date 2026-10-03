import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRequererPapel,
  mockCreate,
  mockFindUnique,
  mockUpdate,
  mockDelete,
  mockRevalidatePath,
  mockUploadFoto,
  mockDeletarFoto,
  mockTransaction,
  mockPostDeleteMany,
} = vi.hoisted(() => ({
  mockRequererPapel: vi.fn(),
  mockCreate: vi.fn(),
  mockFindUnique: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
  mockRevalidatePath: vi.fn(),
  mockUploadFoto: vi.fn(),
  mockDeletarFoto: vi.fn(),
  mockTransaction: vi.fn(),
  mockPostDeleteMany: vi.fn(),
}));

vi.mock("@/lib/auth/requerer-acesso-painel", () => ({
  requererPapel: mockRequererPapel,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    fotoEvolucao: {
      create: mockCreate,
      findUnique: mockFindUnique,
      update: mockUpdate,
      delete: mockDelete,
    },
    post: { deleteMany: mockPostDeleteMany },
    $transaction: mockTransaction,
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
vi.mock("@/lib/storage/fotos", () => ({
  uploadFoto: mockUploadFoto,
  deletarFoto: mockDeletarFoto,
}));

import { enviarFoto, alternarVisibilidadeFoto, excluirFoto } from "./actions";

function buildArquivo() {
  return new File(["conteudo"], "foto.jpg", { type: "image/jpeg" });
}

function buildFormDataComArquivo(arquivo: File) {
  const formData = new FormData();
  formData.set("arquivo", arquivo);
  return formData;
}

function buildFormDataComId(fotoId: string) {
  const formData = new FormData();
  formData.set("fotoId", fotoId);
  return formData;
}

describe("enviarFoto", () => {
  beforeEach(() => {
    mockRequererPapel.mockReset();
    mockCreate.mockReset();
    mockRevalidatePath.mockReset();
    mockUploadFoto.mockReset();
  });

  it("exige o papel CLIENTE", async () => {
    mockRequererPapel.mockRejectedValue(new Error("Acesso negado"));

    await expect(
      enviarFoto(buildFormDataComArquivo(buildArquivo())),
    ).rejects.toThrow("Não foi possível concluir a ação.");
    expect(mockUploadFoto).not.toHaveBeenCalled();
  });

  it("rejeita se nenhum arquivo foi enviado", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "cliente-1" } });

    await expect(enviarFoto(new FormData())).rejects.toThrow(
      "Selecione uma imagem",
    );
    expect(mockUploadFoto).not.toHaveBeenCalled();
  });

  it("faz upload e cria o registro com a chave retornada, usando clienteId da sessão", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "cliente-1" } });
    mockUploadFoto.mockResolvedValue("fotos-evolucao/cliente-1/abc.webp");
    mockCreate.mockResolvedValue({});

    await enviarFoto(buildFormDataComArquivo(buildArquivo()));

    expect(mockUploadFoto).toHaveBeenCalledWith(expect.anything(), "cliente-1");
    expect(mockCreate).toHaveBeenCalledWith({
      data: { clienteId: "cliente-1", chave: "fotos-evolucao/cliente-1/abc.webp" },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/cliente/fotos");
  });
});

describe("alternarVisibilidadeFoto", () => {
  beforeEach(() => {
    mockRequererPapel.mockReset();
    mockFindUnique.mockReset();
    mockUpdate.mockReset();
    mockRevalidatePath.mockReset();
    mockTransaction.mockReset();
    mockPostDeleteMany.mockReset();
    mockDeletarFoto.mockReset();
  });

  it("rejeita se a foto não existe", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindUnique.mockResolvedValue(null);

    await expect(
      alternarVisibilidadeFoto(buildFormDataComId("foto-x")),
    ).rejects.toThrow("Foto não encontrada");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejeita se a foto pertence a outro cliente", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindUnique.mockResolvedValue({
      id: "foto-x",
      clienteId: "outro-cliente",
      publica: false,
    });

    await expect(
      alternarVisibilidadeFoto(buildFormDataComId("foto-x")),
    ).rejects.toThrow("Foto não encontrada");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("privada -> pública: só atualiza publica, sem apagar posts", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindUnique.mockResolvedValue({
      id: "foto-x",
      clienteId: "cliente-1",
      publica: false,
    });
    mockUpdate.mockResolvedValue({});

    await alternarVisibilidadeFoto(buildFormDataComId("foto-x"));

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "foto-x" },
      data: { publica: true },
    });
    expect(mockPostDeleteMany).not.toHaveBeenCalled();
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockRevalidatePath).toHaveBeenCalledWith("/perfil/cliente-1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/feed");
  });

  it("pública -> privada: apaga os posts da foto e atualiza publica na mesma transação, sem tocar no R2", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindUnique.mockResolvedValue({
      id: "foto-x",
      clienteId: "cliente-1",
      publica: true,
    });
    mockPostDeleteMany.mockReturnValue("op-delete-posts");
    mockUpdate.mockReturnValue("op-update-foto");
    mockTransaction.mockResolvedValue([]);

    await alternarVisibilidadeFoto(buildFormDataComId("foto-x"));

    expect(mockPostDeleteMany).toHaveBeenCalledWith({
      where: { fotoEvolucaoId: "foto-x", autorId: "cliente-1" },
    });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "foto-x" },
      data: { publica: false },
    });
    expect(mockTransaction).toHaveBeenCalledWith([
      "op-delete-posts",
      "op-update-foto",
    ]);
    expect(mockDeletarFoto).not.toHaveBeenCalled();
    expect(mockRevalidatePath).toHaveBeenCalledWith("/perfil/cliente-1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/cliente/fotos");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/feed");
  });
});

describe("excluirFoto", () => {
  beforeEach(() => {
    mockRequererPapel.mockReset();
    mockFindUnique.mockReset();
    mockDelete.mockReset();
    mockDeletarFoto.mockReset();
    mockRevalidatePath.mockReset();
    mockTransaction.mockReset();
    mockPostDeleteMany.mockReset();
  });

  it("rejeita se a foto pertence a outro cliente, sem apagar nada", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindUnique.mockResolvedValue({
      id: "foto-x",
      clienteId: "outro-cliente",
      chave: "x",
    });

    await expect(excluirFoto(buildFormDataComId("foto-x"))).rejects.toThrow(
      "Foto não encontrada",
    );
    expect(mockDeletarFoto).not.toHaveBeenCalled();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("apaga posts e foto numa transação e só depois apaga o objeto no R2", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindUnique.mockResolvedValue({
      id: "foto-x",
      clienteId: "cliente-1",
      chave: "fotos-evolucao/cliente-1/abc.webp",
    });
    const ordem: string[] = [];
    mockPostDeleteMany.mockReturnValue("op-delete-posts");
    mockDelete.mockReturnValue("op-delete-foto");
    mockTransaction.mockImplementation(async () => {
      ordem.push("transacao");
    });
    mockDeletarFoto.mockImplementation(async () => {
      ordem.push("r2");
    });

    await excluirFoto(buildFormDataComId("foto-x"));

    expect(mockPostDeleteMany).toHaveBeenCalledWith({
      where: { fotoEvolucaoId: "foto-x", autorId: "cliente-1" },
    });
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "foto-x" } });
    expect(mockTransaction).toHaveBeenCalledWith([
      "op-delete-posts",
      "op-delete-foto",
    ]);
    expect(mockDeletarFoto).toHaveBeenCalledWith(
      "fotos-evolucao/cliente-1/abc.webp",
    );
    expect(ordem).toEqual(["transacao", "r2"]);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/cliente/fotos");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/perfil/cliente-1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/feed");
  });

  it("falha no R2 não quebra a action nem reverte o banco, e é logada", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindUnique.mockResolvedValue({
      id: "foto-x",
      clienteId: "cliente-1",
      chave: "fotos-evolucao/cliente-1/abc.webp",
    });
    mockTransaction.mockResolvedValue([]);
    const erroR2 = new Error("R2 fora do ar");
    mockDeletarFoto.mockRejectedValue(erroR2);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(excluirFoto(buildFormDataComId("foto-x"))).resolves.not.toThrow();

    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("R2"),
      "fotos-evolucao/cliente-1/abc.webp",
      erroR2,
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/feed");
    consoleSpy.mockRestore();
  });

  it("se a transação falhar, não apaga o objeto no R2", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindUnique.mockResolvedValue({
      id: "foto-x",
      clienteId: "cliente-1",
      chave: "fotos-evolucao/cliente-1/abc.webp",
    });
    mockTransaction.mockRejectedValue(new Error("falha no banco"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(excluirFoto(buildFormDataComId("foto-x"))).rejects.toThrow();
    expect(mockDeletarFoto).not.toHaveBeenCalled();
  });
});
