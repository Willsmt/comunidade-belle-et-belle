import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/actions/executar-action";

const {
  mockRequererPapel,
  mockCreate,
  mockFindUnique,
  mockUpdate,
  mockDelete,
  mockRevalidatePath,
  mockUploadFoto,
  mockApagarObjeto,
  mockTransaction,
  mockPostDeleteMany,
  mockGarantirCotaFotosEvolucao,
} = vi.hoisted(() => ({
  mockRequererPapel: vi.fn(),
  mockCreate: vi.fn(),
  mockFindUnique: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
  mockRevalidatePath: vi.fn(),
  mockUploadFoto: vi.fn(),
  mockApagarObjeto: vi.fn(),
  mockTransaction: vi.fn(),
  mockPostDeleteMany: vi.fn(),
  mockGarantirCotaFotosEvolucao: vi.fn(),
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
vi.mock("@/lib/storage/cotas", () => ({
  garantirCotaFotosEvolucao: mockGarantirCotaFotosEvolucao,
}));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
vi.mock("@/lib/storage/fotos", () => ({
  uploadFoto: mockUploadFoto,
}));
vi.mock("@/lib/storage/objetos", () => ({
  apagarObjetoEmMelhorEsforco: mockApagarObjeto,
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
    mockApagarObjeto.mockReset().mockResolvedValue(undefined);
    mockGarantirCotaFotosEvolucao.mockReset().mockResolvedValue(undefined);
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

  it("rejeita sem chamar upload nem criar registro quando a cota estoura", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "cliente-1" } });
    mockGarantirCotaFotosEvolucao.mockRejectedValue(
      new AppError("Você atingiu o limite de 100 fotos. Exclua fotos antigas para enviar novas."),
    );

    await expect(
      enviarFoto(buildFormDataComArquivo(buildArquivo())),
    ).rejects.toThrow("Você atingiu o limite de 100 fotos");

    expect(mockGarantirCotaFotosEvolucao).toHaveBeenCalledWith("cliente-1");
    expect(mockUploadFoto).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
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
    expect(mockApagarObjeto).not.toHaveBeenCalled();
  });

  it("se a escrita no banco falhar, apaga o objeto recém-enviado e relança o erro original", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "cliente-1" } });
    mockUploadFoto.mockResolvedValue("fotos-evolucao/cliente-1/abc.webp");
    mockCreate.mockRejectedValue(new Error("falha no banco"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      enviarFoto(buildFormDataComArquivo(buildArquivo())),
    ).rejects.toThrow("Não foi possível concluir a ação.");

    expect(mockApagarObjeto).toHaveBeenCalledWith(
      "fotos-evolucao/cliente-1/abc.webp",
      expect.any(String),
    );
    expect(console.error).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ message: "falha no banco" }),
    );
    expect(mockRevalidatePath).not.toHaveBeenCalled();
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
    mockApagarObjeto.mockReset();
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
    expect(mockApagarObjeto).not.toHaveBeenCalled();
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
    mockApagarObjeto.mockReset();
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
    expect(mockApagarObjeto).not.toHaveBeenCalled();
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
    mockApagarObjeto.mockImplementation(async () => {
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
    expect(mockApagarObjeto).toHaveBeenCalledWith(
      "fotos-evolucao/cliente-1/abc.webp",
      "excluirFoto",
    );
    expect(ordem).toEqual(["transacao", "r2"]);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/cliente/fotos");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/perfil/cliente-1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/feed");
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
    expect(mockApagarObjeto).not.toHaveBeenCalled();
  });
});
