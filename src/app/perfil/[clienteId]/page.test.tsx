// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PerfilPublicoPage from "./page";
import { obterPerfilPublico } from "./queries";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));

vi.mock("./queries", () => ({
  obterPerfilPublico: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mockAuth }));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

function buildParams(clienteId: string) {
  return Promise.resolve({ clienteId });
}

describe("PerfilPublicoPage", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockAuth.mockResolvedValue({ user: { id: "outra-pessoa-vendo" } });
  });

  it("chama notFound quando o perfil não existe", async () => {
    vi.mocked(obterPerfilPublico).mockResolvedValue(null);

    await expect(
      PerfilPublicoPage({ params: buildParams("nao-existe") }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renderiza nome, bio e medida quando presentes", async () => {
    vi.mocked(obterPerfilPublico).mockResolvedValue({
      nome: "Cliente 1",
      fotoUrl: null,
      bio: "Oi, sou eu",
      emblemasPublicos: true,
      conquistas: [],
      ultimaMedida: { peso: { toString: () => "60" } } as never,
      fotos: [],
      posts: [],
    });

    render(await PerfilPublicoPage({ params: buildParams("cliente-1") }));

    expect(screen.getByText("Cliente 1")).toBeInTheDocument();
    expect(screen.getByText("Oi, sou eu")).toBeInTheDocument();
    expect(screen.getByText("Nenhum emblema ainda")).toBeInTheDocument();
    expect(screen.getByText(/Peso: 60 kg/)).toBeInTheDocument();
  });

  it("mostra 'Emblemas privados' quando emblemasPublicos é false", async () => {
    vi.mocked(obterPerfilPublico).mockResolvedValue({
      nome: "Cliente 2",
      fotoUrl: null,
      bio: null,
      emblemasPublicos: false,
      conquistas: [],
      ultimaMedida: null,
      fotos: [],
      posts: [],
    });

    render(await PerfilPublicoPage({ params: buildParams("cliente-2") }));

    expect(screen.getByText("Emblemas privados")).toBeInTheDocument();
  });

  it("renderiza a lista de emblemas quando emblemasPublicos é true e há conquistas", async () => {
    vi.mocked(obterPerfilPublico).mockResolvedValue({
      nome: "Cliente 4",
      fotoUrl: null,
      bio: null,
      emblemasPublicos: true,
      conquistas: [
        { id: "c1", nome: "Campeã da Semana", icone: "🏆", descricao: "Venceu a semana" },
      ],
      ultimaMedida: null,
      fotos: [],
      posts: [],
    });

    render(await PerfilPublicoPage({ params: buildParams("cliente-4") }));

    expect(screen.getByText("Campeã da Semana")).toBeInTheDocument();
    expect(screen.getByText("🏆")).toBeInTheDocument();
    expect(screen.getByText("Venceu a semana")).toBeInTheDocument();
    expect(screen.queryByText("Nenhum emblema ainda")).not.toBeInTheDocument();
  });

  it("renderiza as fotos públicas quando existem", async () => {
    vi.mocked(obterPerfilPublico).mockResolvedValue({
      nome: "Cliente 3",
      fotoUrl: null,
      bio: null,
      emblemasPublicos: true,
      conquistas: [],
      ultimaMedida: null,
      fotos: [
        { id: "foto-1", data: new Date(), urlAssinada: "https://exemplo/foto-1" },
      ],
      posts: [],
    });

    render(await PerfilPublicoPage({ params: buildParams("cliente-3") }));

    expect(screen.getByAltText("Foto de evolução")).toBeInTheDocument();
  });

  it("renderiza os posts do autor quando existem", async () => {
    vi.mocked(obterPerfilPublico).mockResolvedValue({
      nome: "Cliente 5",
      fotoUrl: null,
      bio: null,
      emblemasPublicos: true,
      conquistas: [],
      ultimaMedida: null,
      fotos: [],
      posts: [
        {
          id: "post-1",
          texto: "reflexão do dia",
          criadoEm: new Date(),
          urlImagem: "https://exemplo/post-1",
        },
      ],
    });

    render(await PerfilPublicoPage({ params: buildParams("cliente-5") }));

    expect(screen.getByText("reflexão do dia")).toBeInTheDocument();
    expect(screen.getByAltText("Imagem do post")).toBeInTheDocument();
  });

  it("mostra o botão de editar perfil quando é a própria pessoa vendo o próprio perfil", async () => {
    mockAuth.mockResolvedValue({ user: { id: "cliente-1" } });
    vi.mocked(obterPerfilPublico).mockResolvedValue({
      nome: "Cliente 1",
      fotoUrl: null,
      bio: null,
      emblemasPublicos: true,
      conquistas: [],
      ultimaMedida: null,
      fotos: [],
      posts: [],
    });

    render(await PerfilPublicoPage({ params: buildParams("cliente-1") }));

    expect(
      screen.getByRole("link", { name: /editar perfil/i }),
    ).toHaveAttribute("href", "/cliente/perfil");
  });

  it("não mostra o botão de editar perfil quando é outra pessoa vendo", async () => {
    mockAuth.mockResolvedValue({ user: { id: "outra-pessoa-vendo" } });
    vi.mocked(obterPerfilPublico).mockResolvedValue({
      nome: "Cliente 1",
      fotoUrl: null,
      bio: null,
      emblemasPublicos: true,
      conquistas: [],
      ultimaMedida: null,
      fotos: [],
      posts: [],
    });

    render(await PerfilPublicoPage({ params: buildParams("cliente-1") }));

    expect(
      screen.queryByRole("link", { name: /editar perfil/i }),
    ).not.toBeInTheDocument();
  });

  it("mostra a foto de perfil quando fotoUrl está presente", async () => {
    vi.mocked(obterPerfilPublico).mockResolvedValue({
      nome: "Cliente 1",
      fotoUrl: "https://exemplo/foto-perfil.jpg",
      bio: null,
      emblemasPublicos: true,
      conquistas: [],
      ultimaMedida: null,
      fotos: [],
      posts: [],
    });

    render(await PerfilPublicoPage({ params: buildParams("cliente-1") }));

    expect(screen.getByAltText("Foto de perfil de Cliente 1")).toHaveAttribute(
      "src",
      "https://exemplo/foto-perfil.jpg",
    );
  });

  it("mostra as iniciais do nome quando não há fotoUrl", async () => {
    vi.mocked(obterPerfilPublico).mockResolvedValue({
      nome: "Cliente Um",
      fotoUrl: null,
      bio: null,
      emblemasPublicos: true,
      conquistas: [],
      ultimaMedida: null,
      fotos: [],
      posts: [],
    });

    render(await PerfilPublicoPage({ params: buildParams("cliente-1") }));

    expect(
      screen.queryByAltText("Foto de perfil de Cliente Um"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("CU")).toBeInTheDocument();
  });
});
