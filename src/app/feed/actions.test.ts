import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRequererSessao,
  mockCreate,
  mockFindUnique,
  mockUpdate,
  mockDelete,
  mockFindUniqueFotoEvolucao,
  mockRevalidatePath,
  mockUploadImagemPost,
  mockDeletarImagemPost,
} = vi.hoisted(() => ({
  mockRequererSessao: vi.fn(),
  mockCreate: vi.fn(),
  mockFindUnique: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
  mockFindUniqueFotoEvolucao: vi.fn(),
  mockRevalidatePath: vi.fn(),
  mockUploadImagemPost: vi.fn(),
  mockDeletarImagemPost: vi.fn(),
}));

vi.mock("@/lib/auth/requerer-acesso-painel", () => ({
  requererSessao: mockRequererSessao,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    post: {
      create: mockCreate,
      findUnique: mockFindUnique,
      update: mockUpdate,
      delete: mockDelete,
    },
    fotoEvolucao: {
      findUnique: mockFindUniqueFotoEvolucao,
    },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
vi.mock("@/lib/storage/posts", () => ({
  uploadImagemPost: mockUploadImagemPost,
  deletarImagemPost: mockDeletarImagemPost,
}));

import { criarPost, editarPost, apagarPost } from "./actions";

function buildArquivo(nome = "post.jpg") {
  return new File(["conteudo"], nome, { type: "image/jpeg" });
}

function buildSessao(userId: string, papeis: string[] = ["CLIENTE"]) {
  return { user: { id: userId, papeis } };
}

function buildFormDataCriar(opts: {
  texto?: string;
  arquivo?: File;
  fotoEvolucaoId?: string;
}) {
  const formData = new FormData();
  if (opts.texto !== undefined) formData.set("texto", opts.texto);
  if (opts.arquivo) formData.set("arquivo", opts.arquivo);
  if (opts.fotoEvolucaoId !== undefined)
    formData.set("fotoEvolucaoId", opts.fotoEvolucaoId);
  return formData;
}

function buildFormDataPostId(postId: string) {
  const formData = new FormData();
  formData.set("postId", postId);
  return formData;
}

function buildFormDataEditar(opts: {
  postId: string;
  texto?: string;
  arquivo?: File;
}) {
  const formData = new FormData();
  formData.set("postId", opts.postId);
  if (opts.texto !== undefined) formData.set("texto", opts.texto);
  if (opts.arquivo) formData.set("arquivo", opts.arquivo);
  return formData;
}

beforeEach(() => {
  mockRequererSessao.mockReset();
  mockCreate.mockReset();
  mockFindUnique.mockReset();
  mockUpdate.mockReset();
  mockDelete.mockReset();
  mockFindUniqueFotoEvolucao.mockReset();
  mockRevalidatePath.mockReset();
  mockUploadImagemPost.mockReset();
  mockDeletarImagemPost.mockReset();
});

describe("criarPost", () => {
  it("exige sessão", async () => {
    mockRequererSessao.mockRejectedValue(new Error("Acesso negado"));

    await expect(
      criarPost(buildFormDataCriar({ texto: "oi" })),
    ).rejects.toThrow("Acesso negado");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejeita se não tem texto, arquivo nem fotoEvolucaoId", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("cliente-1"));

    await expect(criarPost(new FormData())).rejects.toThrow(
      "O post precisa de um texto ou uma imagem",
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("cria post só com texto", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("cliente-1"));
    mockCreate.mockResolvedValue({});

    await criarPost(buildFormDataCriar({ texto: "  progresso da semana  " }));

    expect(mockUploadImagemPost).not.toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        autorId: "cliente-1",
        texto: "progresso da semana",
        imagemChave: null,
        fotoEvolucaoId: null,
      },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/feed");
  });

  it("cria post com upload de imagem nova", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("cliente-1"));
    mockUploadImagemPost.mockResolvedValue("posts/cliente-1/abc.webp");
    mockCreate.mockResolvedValue({});

    await criarPost(buildFormDataCriar({ arquivo: buildArquivo() }));

    expect(mockUploadImagemPost).toHaveBeenCalledWith(
      expect.anything(),
      "cliente-1",
    );
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        autorId: "cliente-1",
        texto: null,
        imagemChave: "posts/cliente-1/abc.webp",
        fotoEvolucaoId: null,
      },
    });
  });

  it("rejeita fotoEvolucaoId que não pertence ao usuário", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("cliente-1"));
    mockFindUniqueFotoEvolucao.mockResolvedValue({
      id: "foto-x",
      clienteId: "outro-cliente",
      chave: "fotos-evolucao/outro-cliente/x.webp",
    });

    await expect(
      criarPost(buildFormDataCriar({ fotoEvolucaoId: "foto-x" })),
    ).rejects.toThrow("Foto de evolução inválida");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("cria post reaproveitando uma FotoEvolucao existente, sem novo upload", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("cliente-1"));
    mockFindUniqueFotoEvolucao.mockResolvedValue({
      id: "foto-x",
      clienteId: "cliente-1",
      chave: "fotos-evolucao/cliente-1/x.webp",
    });
    mockCreate.mockResolvedValue({});

    await criarPost(buildFormDataCriar({ fotoEvolucaoId: "foto-x" }));

    expect(mockUploadImagemPost).not.toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        autorId: "cliente-1",
        texto: null,
        imagemChave: "fotos-evolucao/cliente-1/x.webp",
        fotoEvolucaoId: "foto-x",
      },
    });
  });
});

describe("editarPost", () => {
  it("exige sessão", async () => {
    mockRequererSessao.mockRejectedValue(new Error("Acesso negado"));

    await expect(
      editarPost(buildFormDataEditar({ postId: "post-1", texto: "novo" })),
    ).rejects.toThrow("Acesso negado");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejeita se o post não existe", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("cliente-1"));
    mockFindUnique.mockResolvedValue(null);

    await expect(
      editarPost(buildFormDataEditar({ postId: "post-x", texto: "novo" })),
    ).rejects.toThrow("Post não encontrado");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejeita se não é autor nem moderador", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("cliente-1"));
    mockFindUnique.mockResolvedValue({
      id: "post-1",
      autorId: "outro-cliente",
      texto: "original",
      imagemChave: null,
      fotoEvolucaoId: null,
    });

    await expect(
      editarPost(buildFormDataEditar({ postId: "post-1", texto: "novo" })),
    ).rejects.toThrow("Acesso negado");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejeita se é moderador mas não é o autor", async () => {
    mockRequererSessao.mockResolvedValue(
      buildSessao("patty-1", ["GESTORA"]),
    );
    mockFindUnique.mockResolvedValue({
      id: "post-1",
      autorId: "cliente-1",
      texto: "original",
      imagemChave: null,
      fotoEvolucaoId: null,
    });

    await expect(
      editarPost(buildFormDataEditar({ postId: "post-1", texto: "novo" })),
    ).rejects.toThrow("Só o autor pode editar o post");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("edita o texto mantendo a imagem existente", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("cliente-1"));
    mockFindUnique.mockResolvedValue({
      id: "post-1",
      autorId: "cliente-1",
      texto: "original",
      imagemChave: "posts/cliente-1/abc.webp",
      fotoEvolucaoId: null,
    });
    mockUpdate.mockResolvedValue({});

    await editarPost(
      buildFormDataEditar({ postId: "post-1", texto: "atualizado" }),
    );

    expect(mockDeletarImagemPost).not.toHaveBeenCalled();
    expect(mockUploadImagemPost).not.toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "post-1" },
      data: {
        texto: "atualizado",
        imagemChave: "posts/cliente-1/abc.webp",
        fotoEvolucaoId: null,
      },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/feed");
  });

  it("troca a imagem, apagando a antiga do R2 quando era upload exclusivo", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("cliente-1"));
    mockFindUnique.mockResolvedValue({
      id: "post-1",
      autorId: "cliente-1",
      texto: "original",
      imagemChave: "posts/cliente-1/antiga.webp",
      fotoEvolucaoId: null,
    });
    mockUploadImagemPost.mockResolvedValue("posts/cliente-1/nova.webp");
    mockUpdate.mockResolvedValue({});

    await editarPost(
      buildFormDataEditar({
        postId: "post-1",
        texto: "original",
        arquivo: buildArquivo(),
      }),
    );

    expect(mockDeletarImagemPost).toHaveBeenCalledWith(
      "posts/cliente-1/antiga.webp",
    );
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "post-1" },
      data: {
        texto: "original",
        imagemChave: "posts/cliente-1/nova.webp",
        fotoEvolucaoId: null,
      },
    });
  });

  it("troca a imagem sem apagar do R2 quando a antiga era reaproveitada de FotoEvolucao", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("cliente-1"));
    mockFindUnique.mockResolvedValue({
      id: "post-1",
      autorId: "cliente-1",
      texto: "original",
      imagemChave: "fotos-evolucao/cliente-1/x.webp",
      fotoEvolucaoId: "foto-x",
    });
    mockUploadImagemPost.mockResolvedValue("posts/cliente-1/nova.webp");
    mockUpdate.mockResolvedValue({});

    await editarPost(
      buildFormDataEditar({
        postId: "post-1",
        texto: "original",
        arquivo: buildArquivo(),
      }),
    );

    expect(mockDeletarImagemPost).not.toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "post-1" },
      data: {
        texto: "original",
        imagemChave: "posts/cliente-1/nova.webp",
        fotoEvolucaoId: null,
      },
    });
  });

  it("rejeita se o resultado final não teria nem texto nem imagem", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("cliente-1"));
    mockFindUnique.mockResolvedValue({
      id: "post-1",
      autorId: "cliente-1",
      texto: "original",
      imagemChave: null,
      fotoEvolucaoId: null,
    });

    await expect(
      editarPost(buildFormDataEditar({ postId: "post-1", texto: "   " })),
    ).rejects.toThrow("O post precisa de um texto ou uma imagem");
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe("apagarPost", () => {
  it("exige sessão", async () => {
    mockRequererSessao.mockRejectedValue(new Error("Acesso negado"));

    await expect(apagarPost(buildFormDataPostId("post-1"))).rejects.toThrow(
      "Acesso negado",
    );
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("rejeita se o post não existe", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("cliente-1"));
    mockFindUnique.mockResolvedValue(null);

    await expect(apagarPost(buildFormDataPostId("post-x"))).rejects.toThrow(
      "Post não encontrado",
    );
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("rejeita se não é autor nem moderador", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("cliente-1"));
    mockFindUnique.mockResolvedValue({
      id: "post-1",
      autorId: "outro-cliente",
      imagemChave: null,
      fotoEvolucaoId: null,
    });

    await expect(apagarPost(buildFormDataPostId("post-1"))).rejects.toThrow(
      "Acesso negado",
    );
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("autor apaga o próprio post e a imagem do R2 quando é upload exclusivo", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("cliente-1"));
    mockFindUnique.mockResolvedValue({
      id: "post-1",
      autorId: "cliente-1",
      imagemChave: "posts/cliente-1/abc.webp",
      fotoEvolucaoId: null,
    });
    mockDelete.mockResolvedValue({});

    await apagarPost(buildFormDataPostId("post-1"));

    expect(mockDeletarImagemPost).toHaveBeenCalledWith(
      "posts/cliente-1/abc.webp",
    );
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "post-1" } });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/feed");
  });

  it("moderador apaga post de outra pessoa", async () => {
    mockRequererSessao.mockResolvedValue(
      buildSessao("patty-1", ["GESTORA"]),
    );
    mockFindUnique.mockResolvedValue({
      id: "post-1",
      autorId: "cliente-1",
      imagemChave: "posts/cliente-1/abc.webp",
      fotoEvolucaoId: null,
    });
    mockDelete.mockResolvedValue({});

    await apagarPost(buildFormDataPostId("post-1"));

    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "post-1" } });
  });

  it("não apaga do R2 quando a imagem era reaproveitada de FotoEvolucao", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("cliente-1"));
    mockFindUnique.mockResolvedValue({
      id: "post-1",
      autorId: "cliente-1",
      imagemChave: "fotos-evolucao/cliente-1/x.webp",
      fotoEvolucaoId: "foto-x",
    });
    mockDelete.mockResolvedValue({});

    await apagarPost(buildFormDataPostId("post-1"));

    expect(mockDeletarImagemPost).not.toHaveBeenCalled();
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "post-1" } });
  });
});
