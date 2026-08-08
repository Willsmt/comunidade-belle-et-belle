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
} = vi.hoisted(() => ({
  mockRequererPapel: vi.fn(),
  mockCreate: vi.fn(),
  mockFindUnique: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
  mockRevalidatePath: vi.fn(),
  mockUploadFoto: vi.fn(),
  mockDeletarFoto: vi.fn(),
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
    ).rejects.toThrow("Acesso negado");
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

  it("inverte o valor de publica da própria foto", async () => {
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
    expect(mockRevalidatePath).toHaveBeenCalledWith("/perfil/cliente-1");
  });
});

describe("excluirFoto", () => {
  beforeEach(() => {
    mockRequererPapel.mockReset();
    mockFindUnique.mockReset();
    mockDelete.mockReset();
    mockDeletarFoto.mockReset();
    mockRevalidatePath.mockReset();
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

  it("apaga do R2 e do banco a própria foto", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindUnique.mockResolvedValue({
      id: "foto-x",
      clienteId: "cliente-1",
      chave: "fotos-evolucao/cliente-1/abc.webp",
    });
    mockDeletarFoto.mockResolvedValue(undefined);
    mockDelete.mockResolvedValue({});

    await excluirFoto(buildFormDataComId("foto-x"));

    expect(mockDeletarFoto).toHaveBeenCalledWith(
      "fotos-evolucao/cliente-1/abc.webp",
    );
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "foto-x" } });
  });
});
