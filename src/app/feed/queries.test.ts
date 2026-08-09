import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockFindManyPost,
  mockFindUniquePost,
  mockFindManyFoto,
  mockFindFirstDesafio,
  mockGerarUrlAssinada,
} = vi.hoisted(() => ({
  mockFindManyPost: vi.fn(),
  mockFindUniquePost: vi.fn(),
  mockFindManyFoto: vi.fn(),
  mockFindFirstDesafio: vi.fn(),
  mockGerarUrlAssinada: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    post: { findMany: mockFindManyPost, findUnique: mockFindUniquePost },
    fotoEvolucao: { findMany: mockFindManyFoto },
    desafio: { findFirst: mockFindFirstDesafio },
  },
}));
vi.mock("@/lib/storage/objetos", () => ({
  gerarUrlAssinada: mockGerarUrlAssinada,
}));

import {
  listarPosts,
  obterPost,
  listarFotosEvolucaoDoUsuario,
  obterTeaserDesafioAtivo,
} from "./queries";

function buildPost(id: string) {
  return {
    id,
    autorId: "autor-1",
    texto: "texto",
    imagemChave: null,
    fotoEvolucaoId: null,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    autor: { id: "autor-1", name: "Autor" },
    likes: [],
    comentarios: [],
    _count: { likes: 0 },
  };
}

beforeEach(() => {
  mockFindManyPost.mockReset();
  mockFindUniquePost.mockReset();
  mockFindManyFoto.mockReset();
  mockFindFirstDesafio.mockReset();
  mockGerarUrlAssinada.mockReset();
});

describe("listarPosts", () => {
  it("busca sem cursor quando não informado", async () => {
    mockFindManyPost.mockResolvedValue([]);

    await listarPosts("usuario-1");

    const chamada = mockFindManyPost.mock.calls[0][0];
    expect(chamada.take).toBe(11);
    expect(chamada.cursor).toBeUndefined();
    expect(chamada.skip).toBeUndefined();
  });

  it("busca com cursor e skip quando informado", async () => {
    mockFindManyPost.mockResolvedValue([]);

    await listarPosts("usuario-1", "post-5");

    const chamada = mockFindManyPost.mock.calls[0][0];
    expect(chamada.cursor).toEqual({ id: "post-5" });
    expect(chamada.skip).toBe(1);
  });

  it("filtra likes pelo usuário logado", async () => {
    mockFindManyPost.mockResolvedValue([]);

    await listarPosts("usuario-1");

    const chamada = mockFindManyPost.mock.calls[0][0];
    expect(chamada.include.likes.where).toEqual({ usuarioId: "usuario-1" });
  });

  it("retorna proximoCursor null quando não há mais páginas", async () => {
    mockFindManyPost.mockResolvedValue([buildPost("post-1")]);

    const resultado = await listarPosts("usuario-1");

    expect(resultado.posts).toHaveLength(1);
    expect(resultado.proximoCursor).toBeNull();
  });

  it("retorna proximoCursor com o id do último post da página quando há mais que o tamanho da página", async () => {
    const posts = Array.from({ length: 11 }, (_, i) => buildPost(`post-${i}`));
    mockFindManyPost.mockResolvedValue(posts);

    const resultado = await listarPosts("usuario-1");

    expect(resultado.posts).toHaveLength(10);
    expect(resultado.proximoCursor).toBe("post-9");
  });

  it("marca curtidoPeloUsuario true e usa o _count quando há like do usuário", async () => {
    mockFindManyPost.mockResolvedValue([
      { ...buildPost("post-1"), likes: [{ id: "like-1" }], _count: { likes: 3 } },
    ]);

    const resultado = await listarPosts("usuario-1");

    expect(resultado.posts[0].curtidoPeloUsuario).toBe(true);
    expect(resultado.posts[0].totalCurtidas).toBe(3);
  });

  it("marca curtidoPeloUsuario false quando não há like do usuário", async () => {
    mockFindManyPost.mockResolvedValue([
      { ...buildPost("post-1"), likes: [], _count: { likes: 0 } },
    ]);

    const resultado = await listarPosts("usuario-1");

    expect(resultado.posts[0].curtidoPeloUsuario).toBe(false);
  });

  it("gera signed URL só quando o post tem imagemChave", async () => {
    mockFindManyPost.mockResolvedValue([
      { ...buildPost("post-1"), imagemChave: "posts/x.webp" },
      { ...buildPost("post-2"), imagemChave: null },
    ]);
    mockGerarUrlAssinada.mockResolvedValue("https://url-assinada.exemplo");

    const resultado = await listarPosts("usuario-1");

    expect(resultado.posts[0].urlImagem).toBe("https://url-assinada.exemplo");
    expect(resultado.posts[1].urlImagem).toBeNull();
    expect(mockGerarUrlAssinada).toHaveBeenCalledTimes(1);
  });
});

describe("obterPost", () => {
  it("busca o post pelo id", async () => {
    mockFindUniquePost.mockResolvedValue({ id: "post-1" });

    const resultado = await obterPost("post-1");

    expect(mockFindUniquePost).toHaveBeenCalledWith({ where: { id: "post-1" } });
    expect(resultado).toEqual({ id: "post-1" });
  });
});

describe("listarFotosEvolucaoDoUsuario", () => {
  it("busca as fotos do usuário, mais recentes primeiro, com signed URL cada uma", async () => {
    mockFindManyFoto.mockResolvedValue([{ id: "foto-1", chave: "chave-1" }]);
    mockGerarUrlAssinada.mockResolvedValue("https://url-assinada.exemplo");

    const resultado = await listarFotosEvolucaoDoUsuario("usuario-1");

    expect(mockFindManyFoto).toHaveBeenCalledWith({
      where: { clienteId: "usuario-1" },
      orderBy: { data: "desc" },
    });
    expect(resultado[0].urlAssinada).toBe("https://url-assinada.exemplo");
  });
});

describe("obterTeaserDesafioAtivo", () => {
  it("busca o desafio ativo só com id, titulo e dataFim", async () => {
    mockFindFirstDesafio.mockResolvedValue({
      id: "desafio-1",
      titulo: "Glow Up",
      dataFim: new Date(),
    });

    const resultado = await obterTeaserDesafioAtivo();

    expect(mockFindFirstDesafio).toHaveBeenCalledWith({
      where: { ativo: true },
      select: { id: true, titulo: true, dataFim: true },
    });
    expect(resultado?.titulo).toBe("Glow Up");
  });
});
