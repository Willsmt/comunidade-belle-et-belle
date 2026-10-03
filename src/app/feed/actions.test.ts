import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/actions/executar-action";

const {
  mockRequererSessao,
  mockRequererAcessoPainel,
  mockPostCreate,
  mockPostFindUnique,
  mockPostUpdate,
  mockPostUpdateMany,
  mockPostDelete,
  mockTransaction,
  mockFindUniqueFotoEvolucao,
  mockLikeFindUnique,
  mockLikeCreate,
  mockLikeDelete,
  mockLikeCount,
  mockComentarioCreate,
  mockComentarioFindUnique,
  mockComentarioDelete,
  mockRevalidatePath,
  mockUploadImagemPost,
  mockDeletarImagemPost,
  mockRedirect,
  mockGarantirCotaPostsComImagem,
} = vi.hoisted(() => ({
  mockRequererSessao: vi.fn(),
  mockRequererAcessoPainel: vi.fn(),
  mockPostCreate: vi.fn(),
  mockPostFindUnique: vi.fn(),
  mockPostUpdate: vi.fn(),
  mockPostUpdateMany: vi.fn(),
  mockPostDelete: vi.fn(),
  mockTransaction: vi.fn(),
  mockFindUniqueFotoEvolucao: vi.fn(),
  mockLikeFindUnique: vi.fn(),
  mockLikeCreate: vi.fn(),
  mockLikeDelete: vi.fn(),
  mockLikeCount: vi.fn(),
  mockComentarioCreate: vi.fn(),
  mockComentarioFindUnique: vi.fn(),
  mockComentarioDelete: vi.fn(),
  mockRevalidatePath: vi.fn(),
  mockUploadImagemPost: vi.fn(),
  mockDeletarImagemPost: vi.fn(),
  mockRedirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
  mockGarantirCotaPostsComImagem: vi.fn(),
}));

vi.mock("@/lib/auth/requerer-acesso-painel", () => ({
  requererSessao: mockRequererSessao,
  requererAcessoPainel: mockRequererAcessoPainel,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    post: {
      create: mockPostCreate,
      findUnique: mockPostFindUnique,
      update: mockPostUpdate,
      updateMany: mockPostUpdateMany,
      delete: mockPostDelete,
    },
    fotoEvolucao: {
      findUnique: mockFindUniqueFotoEvolucao,
    },
    like: {
      findUnique: mockLikeFindUnique,
      create: mockLikeCreate,
      delete: mockLikeDelete,
      count: mockLikeCount,
    },
    comentario: {
      create: mockComentarioCreate,
      findUnique: mockComentarioFindUnique,
      delete: mockComentarioDelete,
    },
    $transaction: mockTransaction,
  },
}));
vi.mock("@/lib/storage/cotas", () => ({
  garantirCotaPostsComImagem: mockGarantirCotaPostsComImagem,
}));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
  // executarAction chama isso antes de qualquer outro tratamento; como o
  // mock de redirect() acima simula o sinal lançando um Error comum (sem
  // o "digest" real do Next), replicamos aqui o mesmo critério: só
  // relança o que "parece" ser esse sinal, o resto segue o fluxo normal.
  unstable_rethrow: (erro: unknown) => {
    if (erro instanceof Error && erro.message === "NEXT_REDIRECT") throw erro;
  },
}));
vi.mock("@/lib/storage/posts", () => ({
  uploadImagemPost: mockUploadImagemPost,
  deletarImagemPost: mockDeletarImagemPost,
}));

import {
  criarPost,
  editarPost,
  apagarPost,
  alternarCurtida,
  comentar,
  apagarComentario,
  alternarDestaque,
} from "./actions";

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
  destaque?: boolean;
}) {
  const formData = new FormData();
  if (opts.texto !== undefined) formData.set("texto", opts.texto);
  if (opts.arquivo) formData.set("arquivo", opts.arquivo);
  if (opts.fotoEvolucaoId !== undefined)
    formData.set("fotoEvolucaoId", opts.fotoEvolucaoId);
  if (opts.destaque) formData.set("destaque", "on");
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

function buildFormDataComentar(postId: string, texto?: string) {
  const formData = new FormData();
  formData.set("postId", postId);
  if (texto !== undefined) formData.set("texto", texto);
  return formData;
}

function buildFormDataComentarioId(comentarioId: string) {
  const formData = new FormData();
  formData.set("comentarioId", comentarioId);
  return formData;
}

beforeEach(() => {
  mockRequererSessao.mockReset();
  mockRequererAcessoPainel.mockReset();
  mockPostCreate.mockReset();
  mockPostFindUnique.mockReset();
  mockPostUpdate.mockReset();
  mockPostUpdateMany.mockReset();
  mockPostDelete.mockReset();
  mockTransaction.mockReset();
  mockFindUniqueFotoEvolucao.mockReset();
  mockLikeFindUnique.mockReset();
  mockLikeCreate.mockReset();
  mockLikeDelete.mockReset();
  mockLikeCount.mockReset();
  mockComentarioCreate.mockReset();
  mockComentarioFindUnique.mockReset();
  mockComentarioDelete.mockReset();
  mockRevalidatePath.mockReset();
  mockUploadImagemPost.mockReset();
  mockDeletarImagemPost.mockReset();
  mockRedirect.mockClear();
  mockGarantirCotaPostsComImagem.mockReset().mockResolvedValue(undefined);
});

describe("criarPost", () => {
  it("exige sessão", async () => {
    mockRequererSessao.mockRejectedValue(new AppError("Acesso negado"));

    await expect(
      criarPost(buildFormDataCriar({ texto: "oi" })),
    ).rejects.toThrow("Acesso negado");
    expect(mockPostCreate).not.toHaveBeenCalled();
  });

  it("rejeita se não tem texto, arquivo nem fotoEvolucaoId", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("cliente-1"));

    await expect(criarPost(new FormData())).rejects.toThrow(
      "O post precisa de um texto ou uma imagem",
    );
    expect(mockPostCreate).not.toHaveBeenCalled();
  });

  it("rejeita sem chamar upload nem criar post quando a cota de imagens estoura", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("cliente-1"));
    mockGarantirCotaPostsComImagem.mockRejectedValue(
      new AppError("Você atingiu o limite de 10 posts com imagem nas últimas 24 horas. Tente novamente mais tarde."),
    );

    await expect(
      criarPost(buildFormDataCriar({ texto: "oi", arquivo: buildArquivo() })),
    ).rejects.toThrow("Você atingiu o limite de 10 posts com imagem");

    expect(mockGarantirCotaPostsComImagem).toHaveBeenCalledWith("cliente-1");
    expect(mockUploadImagemPost).not.toHaveBeenCalled();
    expect(mockPostCreate).not.toHaveBeenCalled();
  });

  it("não consulta a cota de imagens para post só com texto nem com foto de evolução", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("cliente-1"));
    mockPostCreate.mockResolvedValue({});
    mockFindUniqueFotoEvolucao.mockResolvedValue({
      id: "f1",
      clienteId: "cliente-1",
      publica: true,
      chave: "fotos-evolucao/cliente-1/a.webp",
    });

    await expect(
      criarPost(buildFormDataCriar({ texto: "oi" })),
    ).rejects.toThrow("NEXT_REDIRECT");
    await expect(
      criarPost(buildFormDataCriar({ fotoEvolucaoId: "f1" })),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mockGarantirCotaPostsComImagem).not.toHaveBeenCalled();
  });

  it("cria post só com texto e redireciona pro feed", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("cliente-1"));
    mockPostCreate.mockResolvedValue({});

    await expect(
      criarPost(buildFormDataCriar({ texto: "  progresso da semana  " })),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mockUploadImagemPost).not.toHaveBeenCalled();
    expect(mockPostCreate).toHaveBeenCalledWith({
      data: {
        autorId: "cliente-1",
        texto: "progresso da semana",
        imagemChave: null,
        fotoEvolucaoId: null,
      },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/feed");
    expect(mockRedirect).toHaveBeenCalledWith("/feed");
  });

  it("cria post com upload de imagem nova e redireciona pro feed", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("cliente-1"));
    mockUploadImagemPost.mockResolvedValue("posts/cliente-1/abc.webp");
    mockPostCreate.mockResolvedValue({});

    await expect(
      criarPost(buildFormDataCriar({ arquivo: buildArquivo() })),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mockUploadImagemPost).toHaveBeenCalledWith(
      expect.anything(),
      "cliente-1",
    );
    expect(mockPostCreate).toHaveBeenCalledWith({
      data: {
        autorId: "cliente-1",
        texto: null,
        imagemChave: "posts/cliente-1/abc.webp",
        fotoEvolucaoId: null,
      },
    });
    expect(mockRedirect).toHaveBeenCalledWith("/feed");
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
    expect(mockPostCreate).not.toHaveBeenCalled();
  });

  it("rejeita fotoEvolucaoId de foto privada, mesmo sendo da própria cliente", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("cliente-1"));
    mockFindUniqueFotoEvolucao.mockResolvedValue({
      id: "foto-x",
      clienteId: "cliente-1",
      chave: "fotos-evolucao/cliente-1/x.webp",
      publica: false,
    });

    await expect(
      criarPost(buildFormDataCriar({ fotoEvolucaoId: "foto-x" })),
    ).rejects.toThrow("Só fotos de evolução públicas podem ser anexadas a um post");
    expect(mockPostCreate).not.toHaveBeenCalled();
  });

  it("cria post reaproveitando uma FotoEvolucao existente, sem novo upload", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("cliente-1"));
    mockFindUniqueFotoEvolucao.mockResolvedValue({
      id: "foto-x",
      clienteId: "cliente-1",
      chave: "fotos-evolucao/cliente-1/x.webp",
      publica: true,
    });
    mockPostCreate.mockResolvedValue({});

    await expect(
      criarPost(buildFormDataCriar({ fotoEvolucaoId: "foto-x" })),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mockUploadImagemPost).not.toHaveBeenCalled();
    expect(mockPostCreate).toHaveBeenCalledWith({
      data: {
        autorId: "cliente-1",
        texto: null,
        imagemChave: "fotos-evolucao/cliente-1/x.webp",
        fotoEvolucaoId: "foto-x",
      },
    });
    expect(mockRedirect).toHaveBeenCalledWith("/feed");
  });

  it("rejeita marcar destaque na criação pra quem não tem acesso ao painel", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("cliente-1"));
    mockRequererAcessoPainel.mockRejectedValue(new AppError("Acesso negado"));

    await expect(
      criarPost(buildFormDataCriar({ texto: "oi", destaque: true })),
    ).rejects.toThrow("Acesso negado");
    expect(mockPostCreate).not.toHaveBeenCalled();
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("cria post em destaque desmarcando o destaque anterior numa única transação", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("patty-1", ["GESTORA"]));
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockPostUpdateMany.mockReturnValue("updateMany-op");
    mockPostCreate.mockReturnValue("create-op");
    mockTransaction.mockResolvedValue([{}, {}]);

    await expect(
      criarPost(buildFormDataCriar({ texto: "novo destaque", destaque: true })),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mockPostUpdateMany).toHaveBeenCalledWith({
      where: { destaque: true },
      data: { destaque: false },
    });
    expect(mockPostCreate).toHaveBeenCalledWith({
      data: {
        autorId: "patty-1",
        texto: "novo destaque",
        imagemChave: null,
        fotoEvolucaoId: null,
        destaque: true,
      },
    });
    expect(mockTransaction).toHaveBeenCalledWith(["updateMany-op", "create-op"]);
    expect(mockRedirect).toHaveBeenCalledWith("/feed");
  });

  it("cria post sem destaque normalmente quando a caixa não é marcada, sem transação", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("patty-1", ["GESTORA"]));
    mockPostCreate.mockResolvedValue({});

    await expect(
      criarPost(buildFormDataCriar({ texto: "post comum" })),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mockRequererAcessoPainel).not.toHaveBeenCalled();
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockPostCreate).toHaveBeenCalledWith({
      data: {
        autorId: "patty-1",
        texto: "post comum",
        imagemChave: null,
        fotoEvolucaoId: null,
      },
    });
  });
});

describe("editarPost", () => {
  it("exige sessão", async () => {
    mockRequererSessao.mockRejectedValue(new AppError("Acesso negado"));

    await expect(
      editarPost(buildFormDataEditar({ postId: "post-1", texto: "novo" })),
    ).rejects.toThrow("Acesso negado");
    expect(mockPostUpdate).not.toHaveBeenCalled();
  });

  it("rejeita se o post não existe", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("cliente-1"));
    mockPostFindUnique.mockResolvedValue(null);

    await expect(
      editarPost(buildFormDataEditar({ postId: "post-x", texto: "novo" })),
    ).rejects.toThrow("Post não encontrado");
    expect(mockPostUpdate).not.toHaveBeenCalled();
  });

  it("rejeita se não é autor nem moderador", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("cliente-1"));
    mockPostFindUnique.mockResolvedValue({
      id: "post-1",
      autorId: "outro-cliente",
      texto: "original",
      imagemChave: null,
      fotoEvolucaoId: null,
    });

    await expect(
      editarPost(buildFormDataEditar({ postId: "post-1", texto: "novo" })),
    ).rejects.toThrow("Acesso negado");
    expect(mockPostUpdate).not.toHaveBeenCalled();
  });

  it("rejeita se é moderador mas não é o autor", async () => {
    mockRequererSessao.mockResolvedValue(
      buildSessao("patty-1", ["GESTORA"]),
    );
    mockPostFindUnique.mockResolvedValue({
      id: "post-1",
      autorId: "cliente-1",
      texto: "original",
      imagemChave: null,
      fotoEvolucaoId: null,
    });

    await expect(
      editarPost(buildFormDataEditar({ postId: "post-1", texto: "novo" })),
    ).rejects.toThrow("Só o autor pode editar o post");
    expect(mockPostUpdate).not.toHaveBeenCalled();
  });

  it("edita o texto mantendo a imagem existente", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("cliente-1"));
    mockPostFindUnique.mockResolvedValue({
      id: "post-1",
      autorId: "cliente-1",
      texto: "original",
      imagemChave: "posts/cliente-1/abc.webp",
      fotoEvolucaoId: null,
    });
    mockPostUpdate.mockResolvedValue({});

    await editarPost(
      buildFormDataEditar({ postId: "post-1", texto: "atualizado" }),
    );

    expect(mockDeletarImagemPost).not.toHaveBeenCalled();
    expect(mockUploadImagemPost).not.toHaveBeenCalled();
    expect(mockPostUpdate).toHaveBeenCalledWith({
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
    mockPostFindUnique.mockResolvedValue({
      id: "post-1",
      autorId: "cliente-1",
      texto: "original",
      imagemChave: "posts/cliente-1/antiga.webp",
      fotoEvolucaoId: null,
    });
    mockUploadImagemPost.mockResolvedValue("posts/cliente-1/nova.webp");
    mockPostUpdate.mockResolvedValue({});

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
    expect(mockPostUpdate).toHaveBeenCalledWith({
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
    mockPostFindUnique.mockResolvedValue({
      id: "post-1",
      autorId: "cliente-1",
      texto: "original",
      imagemChave: "fotos-evolucao/cliente-1/x.webp",
      fotoEvolucaoId: "foto-x",
    });
    mockUploadImagemPost.mockResolvedValue("posts/cliente-1/nova.webp");
    mockPostUpdate.mockResolvedValue({});

    await editarPost(
      buildFormDataEditar({
        postId: "post-1",
        texto: "original",
        arquivo: buildArquivo(),
      }),
    );

    expect(mockDeletarImagemPost).not.toHaveBeenCalled();
    expect(mockPostUpdate).toHaveBeenCalledWith({
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
    mockPostFindUnique.mockResolvedValue({
      id: "post-1",
      autorId: "cliente-1",
      texto: "original",
      imagemChave: null,
      fotoEvolucaoId: null,
    });

    await expect(
      editarPost(buildFormDataEditar({ postId: "post-1", texto: "   " })),
    ).rejects.toThrow("O post precisa de um texto ou uma imagem");
    expect(mockPostUpdate).not.toHaveBeenCalled();
  });
});

describe("apagarPost", () => {
  it("exige sessão", async () => {
    mockRequererSessao.mockRejectedValue(new AppError("Acesso negado"));

    await expect(apagarPost(buildFormDataPostId("post-1"))).rejects.toThrow(
      "Acesso negado",
    );
    expect(mockPostDelete).not.toHaveBeenCalled();
  });

  it("rejeita se o post não existe", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("cliente-1"));
    mockPostFindUnique.mockResolvedValue(null);

    await expect(apagarPost(buildFormDataPostId("post-x"))).rejects.toThrow(
      "Post não encontrado",
    );
    expect(mockPostDelete).not.toHaveBeenCalled();
  });

  it("rejeita se não é autor nem moderador", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("cliente-1"));
    mockPostFindUnique.mockResolvedValue({
      id: "post-1",
      autorId: "outro-cliente",
      imagemChave: null,
      fotoEvolucaoId: null,
    });

    await expect(apagarPost(buildFormDataPostId("post-1"))).rejects.toThrow(
      "Acesso negado",
    );
    expect(mockPostDelete).not.toHaveBeenCalled();
  });

  it("autor apaga o próprio post e a imagem do R2 quando é upload exclusivo", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("cliente-1"));
    mockPostFindUnique.mockResolvedValue({
      id: "post-1",
      autorId: "cliente-1",
      imagemChave: "posts/cliente-1/abc.webp",
      fotoEvolucaoId: null,
    });
    mockPostDelete.mockResolvedValue({});

    await apagarPost(buildFormDataPostId("post-1"));

    expect(mockDeletarImagemPost).toHaveBeenCalledWith(
      "posts/cliente-1/abc.webp",
    );
    expect(mockPostDelete).toHaveBeenCalledWith({ where: { id: "post-1" } });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/feed");
  });

  it("moderador apaga post de outra pessoa", async () => {
    mockRequererSessao.mockResolvedValue(
      buildSessao("patty-1", ["GESTORA"]),
    );
    mockPostFindUnique.mockResolvedValue({
      id: "post-1",
      autorId: "cliente-1",
      imagemChave: "posts/cliente-1/abc.webp",
      fotoEvolucaoId: null,
    });
    mockPostDelete.mockResolvedValue({});

    await apagarPost(buildFormDataPostId("post-1"));

    expect(mockPostDelete).toHaveBeenCalledWith({ where: { id: "post-1" } });
  });

  it("não apaga do R2 quando a imagem era reaproveitada de FotoEvolucao", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("cliente-1"));
    mockPostFindUnique.mockResolvedValue({
      id: "post-1",
      autorId: "cliente-1",
      imagemChave: "fotos-evolucao/cliente-1/x.webp",
      fotoEvolucaoId: "foto-x",
    });
    mockPostDelete.mockResolvedValue({});

    await apagarPost(buildFormDataPostId("post-1"));

    expect(mockDeletarImagemPost).not.toHaveBeenCalled();
    expect(mockPostDelete).toHaveBeenCalledWith({ where: { id: "post-1" } });
  });
});

describe("alternarCurtida", () => {
  it("exige sessão", async () => {
    mockRequererSessao.mockRejectedValue(new AppError("Acesso negado"));

    await expect(
      alternarCurtida(buildFormDataPostId("post-1")),
    ).rejects.toThrow("Acesso negado");
    expect(mockLikeCreate).not.toHaveBeenCalled();
  });

  it("cria o like quando ainda não existe", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("cliente-1"));
    mockLikeFindUnique.mockResolvedValue(null);
    mockLikeCreate.mockResolvedValue({});
    mockLikeCount.mockResolvedValue(3);

    const resultado = await alternarCurtida(buildFormDataPostId("post-1"));

    expect(mockLikeCreate).toHaveBeenCalledWith({
      data: { postId: "post-1", usuarioId: "cliente-1" },
    });
    expect(mockLikeDelete).not.toHaveBeenCalled();
    expect(mockLikeCount).toHaveBeenCalledWith({ where: { postId: "post-1" } });
    expect(resultado).toEqual({ curtiu: true, total: 3 });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("remove o like quando já existe (toggle)", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("cliente-1"));
    mockLikeFindUnique.mockResolvedValue({ id: "like-1" });
    mockLikeDelete.mockResolvedValue({});
    mockLikeCount.mockResolvedValue(0);

    const resultado = await alternarCurtida(buildFormDataPostId("post-1"));

    expect(mockLikeDelete).toHaveBeenCalledWith({ where: { id: "like-1" } });
    expect(mockLikeCreate).not.toHaveBeenCalled();
    expect(resultado).toEqual({ curtiu: false, total: 0 });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });
});

describe("comentar", () => {
  it("exige sessão", async () => {
    mockRequererSessao.mockRejectedValue(new AppError("Acesso negado"));

    await expect(
      comentar(buildFormDataComentar("post-1", "oi")),
    ).rejects.toThrow("Acesso negado");
    expect(mockComentarioCreate).not.toHaveBeenCalled();
  });

  it("rejeita texto vazio", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("cliente-1"));

    await expect(
      comentar(buildFormDataComentar("post-1", "   ")),
    ).rejects.toThrow("Escreva um comentário");
    expect(mockComentarioCreate).not.toHaveBeenCalled();
  });

  it("rejeita se o post não existe", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("cliente-1"));
    mockPostFindUnique.mockResolvedValue(null);

    await expect(
      comentar(buildFormDataComentar("post-x", "oi")),
    ).rejects.toThrow("Post não encontrado");
    expect(mockComentarioCreate).not.toHaveBeenCalled();
  });

  it("cria o comentário", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("cliente-1"));
    mockPostFindUnique.mockResolvedValue({ id: "post-1" });
    mockComentarioCreate.mockResolvedValue({});

    await comentar(buildFormDataComentar("post-1", "  arrasou!  "));

    expect(mockComentarioCreate).toHaveBeenCalledWith({
      data: { postId: "post-1", autorId: "cliente-1", texto: "arrasou!" },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/feed");
  });
});

describe("apagarComentario", () => {
  it("exige sessão", async () => {
    mockRequererSessao.mockRejectedValue(new AppError("Acesso negado"));

    await expect(
      apagarComentario(buildFormDataComentarioId("comentario-1")),
    ).rejects.toThrow("Acesso negado");
    expect(mockComentarioDelete).not.toHaveBeenCalled();
  });

  it("rejeita se o comentário não existe", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("cliente-1"));
    mockComentarioFindUnique.mockResolvedValue(null);

    await expect(
      apagarComentario(buildFormDataComentarioId("comentario-x")),
    ).rejects.toThrow("Comentário não encontrado");
    expect(mockComentarioDelete).not.toHaveBeenCalled();
  });

  it("rejeita se não é autor nem moderador", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("cliente-1"));
    mockComentarioFindUnique.mockResolvedValue({
      id: "comentario-1",
      autorId: "outro-cliente",
    });

    await expect(
      apagarComentario(buildFormDataComentarioId("comentario-1")),
    ).rejects.toThrow("Acesso negado");
    expect(mockComentarioDelete).not.toHaveBeenCalled();
  });

  it("autor apaga o próprio comentário", async () => {
    mockRequererSessao.mockResolvedValue(buildSessao("cliente-1"));
    mockComentarioFindUnique.mockResolvedValue({
      id: "comentario-1",
      autorId: "cliente-1",
    });
    mockComentarioDelete.mockResolvedValue({});

    await apagarComentario(buildFormDataComentarioId("comentario-1"));

    expect(mockComentarioDelete).toHaveBeenCalledWith({
      where: { id: "comentario-1" },
    });
  });

  it("moderador apaga comentário de qualquer pessoa", async () => {
    mockRequererSessao.mockResolvedValue(
      buildSessao("patty-1", ["GESTORA"]),
    );
    mockComentarioFindUnique.mockResolvedValue({
      id: "comentario-1",
      autorId: "cliente-1",
    });
    mockComentarioDelete.mockResolvedValue({});

    await apagarComentario(buildFormDataComentarioId("comentario-1"));

    expect(mockComentarioDelete).toHaveBeenCalledWith({
      where: { id: "comentario-1" },
    });
  });
});

describe("alternarDestaque", () => {
  it("exige acesso ao painel", async () => {
    mockRequererAcessoPainel.mockRejectedValue(new AppError("Acesso negado"));

    await expect(alternarDestaque("post-1")).rejects.toThrow("Acesso negado");
    expect(mockPostFindUnique).not.toHaveBeenCalled();
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("rejeita post inexistente", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockPostFindUnique.mockResolvedValue(null);

    await expect(alternarDestaque("post-inexistente")).rejects.toThrow(
      "Post não encontrado",
    );
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("marca como destaque, desmarcando qualquer outro post em destaque numa única transação", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockPostFindUnique.mockResolvedValue({ id: "post-2", destaque: false });
    mockPostUpdateMany.mockReturnValue("updateMany-op");
    mockPostUpdate.mockReturnValue("update-op");
    mockTransaction.mockResolvedValue([{}, {}]);

    await alternarDestaque("post-2");

    expect(mockPostUpdateMany).toHaveBeenCalledWith({
      where: { destaque: true },
      data: { destaque: false },
    });
    expect(mockPostUpdate).toHaveBeenCalledWith({
      where: { id: "post-2" },
      data: { destaque: true },
    });
    expect(mockTransaction).toHaveBeenCalledWith(["updateMany-op", "update-op"]);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/feed");
  });

  it("remove o destaque do próprio post já em destaque, sem afetar os demais", async () => {
    mockRequererAcessoPainel.mockResolvedValue({ user: { id: "patty-1" } });
    mockPostFindUnique.mockResolvedValue({ id: "post-1", destaque: true });
    mockPostUpdate.mockResolvedValue({});

    await alternarDestaque("post-1");

    expect(mockPostUpdate).toHaveBeenCalledWith({
      where: { id: "post-1" },
      data: { destaque: false },
    });
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockRevalidatePath).toHaveBeenCalledWith("/feed");
  });
});
