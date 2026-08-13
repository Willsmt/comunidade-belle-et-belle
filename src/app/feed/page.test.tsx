// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("./queries", () => ({
  listarPosts: vi.fn(),
  obterTeaserDesafioAtivo: vi.fn(),
}));
vi.mock("./actions", () => ({
  apagarPost: vi.fn(),
  alternarCurtida: vi.fn(),
  comentar: vi.fn(),
  apagarComentario: vi.fn(),
}));

import FeedPage from "./page";
import { listarPosts, obterTeaserDesafioAtivo } from "./queries";
import { apagarPost, alternarCurtida, comentar } from "./actions";

function buildSearchParams(cursor?: string) {
  return Promise.resolve(cursor ? { cursor } : {});
}

function buildSessao(userId: string, papeis: string[] = ["CLIENTE"]) {
  return { user: { id: userId, papeis } };
}

function buildPostView(overrides: Record<string, unknown> = {}) {
  return {
    id: "post-1",
    autorId: "cliente-1",
    texto: "texto do post",
    imagemChave: null,
    urlImagem: null,
    fotoEvolucaoId: null,
    criadoEm: new Date("2026-02-01"),
    atualizadoEm: new Date("2026-02-01"),
    autor: { id: "cliente-1", name: "Cliente 1" },
    curtidoPeloUsuario: false,
    totalCurtidas: 0,
    comentarios: [],
    ...overrides,
  };
}

describe("FeedPage", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    vi.mocked(listarPosts).mockReset();
    vi.mocked(obterTeaserDesafioAtivo).mockReset();
  });

  it("retorna null quando não há sessão", async () => {
    mockAuth.mockResolvedValue(null);

    const resultado = await FeedPage({ searchParams: buildSearchParams() });

    expect(resultado).toBeNull();
  });

  it("mostra o estado vazio quando não há posts", async () => {
    mockAuth.mockResolvedValue(buildSessao("cliente-1"));
    vi.mocked(listarPosts).mockResolvedValue({ posts: [], proximoCursor: null } as never);
    vi.mocked(obterTeaserDesafioAtivo).mockResolvedValue(null);

    render(await FeedPage({ searchParams: buildSearchParams() }));

    expect(screen.getByText(/nenhum post ainda/i)).toBeInTheDocument();
  });

  it("mostra o link 'Novo post' pra /feed/novo", async () => {
    mockAuth.mockResolvedValue(buildSessao("cliente-1"));
    vi.mocked(listarPosts).mockResolvedValue({ posts: [], proximoCursor: null } as never);
    vi.mocked(obterTeaserDesafioAtivo).mockResolvedValue(null);

    render(await FeedPage({ searchParams: buildSearchParams() }));

    expect(screen.getByRole("link", { name: /novo post/i })).toHaveAttribute(
      "href",
      "/feed/novo",
    );
  });

  it("mostra o teaser do desafio ativo quando existe, linkando pros Desafios", async () => {
    mockAuth.mockResolvedValue(buildSessao("cliente-1"));
    vi.mocked(listarPosts).mockResolvedValue({ posts: [], proximoCursor: null } as never);
    vi.mocked(obterTeaserDesafioAtivo).mockResolvedValue({
      id: "desafio-1",
      titulo: "Glow Up 30 dias",
      dataFim: new Date("2026-02-01"),
    } as never);

    render(await FeedPage({ searchParams: buildSearchParams() }));

    expect(screen.getByText(/Glow Up 30 dias/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ver desafio/i })).toHaveAttribute(
      "href",
      "/cliente/desafios",
    );
  });

  it("não mostra o teaser quando não há desafio ativo", async () => {
    mockAuth.mockResolvedValue(buildSessao("cliente-1"));
    vi.mocked(listarPosts).mockResolvedValue({ posts: [], proximoCursor: null } as never);
    vi.mocked(obterTeaserDesafioAtivo).mockResolvedValue(null);

    render(await FeedPage({ searchParams: buildSearchParams() }));

    expect(screen.queryByText(/desafio ativo/i)).not.toBeInTheDocument();
  });

  it("renderiza um post com autor, texto, imagem e curtir zerado", async () => {
    mockAuth.mockResolvedValue(buildSessao("cliente-1"));
    vi.mocked(obterTeaserDesafioAtivo).mockResolvedValue(null);
    vi.mocked(listarPosts).mockResolvedValue({
      posts: [buildPostView({ urlImagem: "https://exemplo/post-1" })],
      proximoCursor: null,
    } as never);

    render(await FeedPage({ searchParams: buildSearchParams() }));

    expect(screen.getByText("Cliente 1")).toBeInTheDocument();
    expect(screen.getByText("texto do post")).toBeInTheDocument();
    expect(screen.getByAltText("Imagem do post")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /curtir \(0\)/i })).toBeInTheDocument();
  });

  it("mostra 'Descurtir (N)' quando já curtido pelo usuário", async () => {
    mockAuth.mockResolvedValue(buildSessao("cliente-1"));
    vi.mocked(obterTeaserDesafioAtivo).mockResolvedValue(null);
    vi.mocked(listarPosts).mockResolvedValue({
      posts: [buildPostView({ curtidoPeloUsuario: true, totalCurtidas: 3 })],
      proximoCursor: null,
    } as never);

    render(await FeedPage({ searchParams: buildSearchParams() }));

    expect(
      screen.getByRole("button", { name: /descurtir \(3\)/i }),
    ).toBeInTheDocument();
  });

  it("mostra o link Editar só no próprio post", async () => {
    mockAuth.mockResolvedValue(buildSessao("cliente-1"));
    vi.mocked(obterTeaserDesafioAtivo).mockResolvedValue(null);
    vi.mocked(listarPosts).mockResolvedValue({
      posts: [
        buildPostView({ id: "post-1", autorId: "cliente-1" }),
        buildPostView({ id: "post-2", autorId: "outro-cliente" }),
      ],
      proximoCursor: null,
    } as never);

    render(await FeedPage({ searchParams: buildSearchParams() }));

    expect(screen.getAllByText("Editar")).toHaveLength(1);
  });

  it("moderadora vê o botão Apagar post em post de outra pessoa", async () => {
    mockAuth.mockResolvedValue(buildSessao("patty-1", ["GESTORA"]));
    vi.mocked(obterTeaserDesafioAtivo).mockResolvedValue(null);
    vi.mocked(listarPosts).mockResolvedValue({
      posts: [buildPostView({ autorId: "cliente-1" })],
      proximoCursor: null,
    } as never);

    render(await FeedPage({ searchParams: buildSearchParams() }));

    expect(
      screen.getByRole("button", { name: /apagar post/i }),
    ).toBeInTheDocument();
  });

  it("cliente comum não vê o botão Apagar post de outra pessoa", async () => {
    mockAuth.mockResolvedValue(buildSessao("cliente-2"));
    vi.mocked(obterTeaserDesafioAtivo).mockResolvedValue(null);
    vi.mocked(listarPosts).mockResolvedValue({
      posts: [buildPostView({ autorId: "cliente-1" })],
      proximoCursor: null,
    } as never);

    render(await FeedPage({ searchParams: buildSearchParams() }));

    expect(
      screen.queryByRole("button", { name: /apagar post/i }),
    ).not.toBeInTheDocument();
  });

  it("mostra a mensagem de vazio quando o post não tem comentários", async () => {
    mockAuth.mockResolvedValue(buildSessao("cliente-1"));
    vi.mocked(obterTeaserDesafioAtivo).mockResolvedValue(null);
    vi.mocked(listarPosts).mockResolvedValue({
      posts: [buildPostView({ comentarios: [] })],
      proximoCursor: null,
    } as never);

    render(await FeedPage({ searchParams: buildSearchParams() }));

    expect(screen.getByText(/nenhum comentário ainda/i)).toBeInTheDocument();
  });

  it("renderiza os comentários existentes com botão apagar pro autor do comentário", async () => {
    mockAuth.mockResolvedValue(buildSessao("cliente-1"));
    vi.mocked(obterTeaserDesafioAtivo).mockResolvedValue(null);
    vi.mocked(listarPosts).mockResolvedValue({
      posts: [
        buildPostView({
          comentarios: [
            {
              id: "comentario-1",
              texto: "arrasou!",
              autorId: "cliente-1",
              autor: { id: "cliente-1", name: "Cliente 1" },
            },
          ],
        }),
      ],
      proximoCursor: null,
    } as never);

    render(await FeedPage({ searchParams: buildSearchParams() }));

    expect(screen.getByText("arrasou!")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^apagar$/i })).toBeInTheDocument();
  });

  it("mostra a foto do autor do comentário quando tem fotoUrl, e as iniciais quando não tem", async () => {
    mockAuth.mockResolvedValue(buildSessao("cliente-1"));
    vi.mocked(obterTeaserDesafioAtivo).mockResolvedValue(null);
    vi.mocked(listarPosts).mockResolvedValue({
      posts: [
        buildPostView({
          comentarios: [
            {
              id: "comentario-1",
              texto: "com foto",
              autorId: "cliente-1",
              autor: {
                id: "cliente-1",
                name: "Cliente Um",
                fotoUrl: "https://exemplo/foto-comentario.jpg",
              },
            },
            {
              id: "comentario-2",
              texto: "sem foto",
              autorId: "cliente-2",
              autor: { id: "cliente-2", name: "Cliente Dois", fotoUrl: null },
            },
          ],
        }),
      ],
      proximoCursor: null,
    } as never);

    render(await FeedPage({ searchParams: buildSearchParams() }));

    expect(
      screen.getByAltText("Foto de perfil de Cliente Um"),
    ).toHaveAttribute("src", "https://exemplo/foto-comentario.jpg");
    expect(screen.getByText("CD")).toBeInTheDocument();
  });

  it("mostra 'Carregar mais' quando há proximoCursor, linkando com o cursor certo", async () => {
    mockAuth.mockResolvedValue(buildSessao("cliente-1"));
    vi.mocked(obterTeaserDesafioAtivo).mockResolvedValue(null);
    vi.mocked(listarPosts).mockResolvedValue({ posts: [], proximoCursor: "post-9" } as never);

    render(await FeedPage({ searchParams: buildSearchParams() }));

    expect(
      screen.getByRole("link", { name: /carregar mais/i }),
    ).toHaveAttribute("href", "/feed?cursor=post-9");
  });

  it("não mostra 'Carregar mais' quando não há mais páginas", async () => {
    mockAuth.mockResolvedValue(buildSessao("cliente-1"));
    vi.mocked(obterTeaserDesafioAtivo).mockResolvedValue(null);
    vi.mocked(listarPosts).mockResolvedValue({ posts: [], proximoCursor: null } as never);

    render(await FeedPage({ searchParams: buildSearchParams() }));

    expect(
      screen.queryByRole("link", { name: /carregar mais/i }),
    ).not.toBeInTheDocument();
  });

  it("mostra a mensagem de erro original quando curtir falha", async () => {
    mockAuth.mockResolvedValue(buildSessao("cliente-1"));
    vi.mocked(obterTeaserDesafioAtivo).mockResolvedValue(null);
    vi.mocked(listarPosts).mockResolvedValue({
      posts: [buildPostView()],
      proximoCursor: null,
    } as never);
    vi.mocked(alternarCurtida).mockRejectedValue(new Error("Post inválido"));

    render(await FeedPage({ searchParams: buildSearchParams() }));

    fireEvent.click(screen.getByRole("button", { name: /curtir \(0\)/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Post inválido"),
    );
  });

  it("pede confirmação e mostra a mensagem de erro original quando apagar post falha", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    mockAuth.mockResolvedValue(buildSessao("cliente-1"));
    vi.mocked(obterTeaserDesafioAtivo).mockResolvedValue(null);
    vi.mocked(listarPosts).mockResolvedValue({
      posts: [buildPostView({ autorId: "cliente-1" })],
      proximoCursor: null,
    } as never);
    vi.mocked(apagarPost).mockRejectedValue(new Error("Acesso negado"));

    render(await FeedPage({ searchParams: buildSearchParams() }));

    fireEvent.click(screen.getByRole("button", { name: /apagar post/i }));

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Acesso negado"),
    );
  });

  it("mostra a mensagem de erro original quando comentar falha", async () => {
    mockAuth.mockResolvedValue(buildSessao("cliente-1"));
    vi.mocked(obterTeaserDesafioAtivo).mockResolvedValue(null);
    vi.mocked(listarPosts).mockResolvedValue({
      posts: [buildPostView()],
      proximoCursor: null,
    } as never);
    vi.mocked(comentar).mockRejectedValue(new Error("Escreva um comentário"));

    render(await FeedPage({ searchParams: buildSearchParams() }));

    fireEvent.change(screen.getByLabelText(/comentar/i), {
      target: { value: "oi" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^enviar$/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Escreva um comentário",
      ),
    );
  });
});
