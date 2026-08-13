// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DesafiosClientePage from "./page";
import { redirect } from "next/navigation";
import { obterDesafioAtivoParaCliente, obterFluxoEncerramento } from "./queries";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("@/auth", () => ({ auth: mockAuth }));

vi.mock("./queries", () => ({
  obterDesafioAtivoParaCliente: vi.fn(),
  obterFluxoEncerramento: vi.fn(),
}));

vi.mock("./actions", () => ({
  alternarMarcacao: vi.fn(),
  participarDesafioSurpresa: vi.fn(),
  enviarFotoAntes: vi.fn(),
  enviarFotoDepois: vi.fn(),
  marcarAvisoEncerramentoVisto: vi.fn(),
  salvarReflexao: vi.fn(),
}));

describe("DesafiosClientePage", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockAuth.mockResolvedValue({ user: { papeis: ["CLIENTE"] } });
    vi.mocked(obterDesafioAtivoParaCliente).mockReset();
    vi.mocked(obterFluxoEncerramento).mockReset();
  });

  it("redireciona quem não tem CLIENTE nem GESTORA/ADMIN, sem buscar dados do desafio", async () => {
    mockAuth.mockResolvedValue({ user: { papeis: ["PARCERIA"] } });

    await expect(DesafiosClientePage()).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/");
    expect(obterDesafioAtivoParaCliente).not.toHaveBeenCalled();
  });

  it("mostra mensagem quando não há desafio ativo nem encerrado", async () => {
    vi.mocked(obterDesafioAtivoParaCliente).mockResolvedValue(null);
    vi.mocked(obterFluxoEncerramento).mockResolvedValue(null);

    render(await DesafiosClientePage());

    expect(screen.getByText(/nenhum desafio ativo/i)).toBeInTheDocument();
  });

  it("renderiza o desafio ativo com categorias, itens, ranking e a seção de fotos", async () => {
    vi.mocked(obterDesafioAtivoParaCliente).mockResolvedValue({
      desafio: {
        id: "d1",
        titulo: "Glow Up",
        fraseMotivacional: "Você é capaz",
        categorias: [
          {
            id: "c1",
            nome: "Pele",
            cor: "#f5c",
            itens: [
              { id: "i1", descricao: "Hidratar", pontos: 5 },
              { id: "i2", descricao: "Protetor solar", pontos: 3 },
            ],
          },
        ],
        desafiosSurpresa: [],
      },
      itensMarcadosHoje: new Set(["i1"]),
      rankingSemanal: [{ clienteId: "cliente-1", nome: "Você", pontos: 8 }],
      rankingGeral: [{ clienteId: "cliente-1", nome: "Você", pontos: 20 }],
      clienteId: "cliente-1",
      fotoAntesUrl: null,
      fotoDepoisUrl: null,
    } as never);

    render(await DesafiosClientePage());

    expect(screen.getByText("Glow Up")).toBeInTheDocument();
    expect(screen.getByText("Hidratar")).toBeInTheDocument();
    expect(screen.getAllByText(/nenhuma foto enviada ainda/i)).toHaveLength(2);
  });

  it("mostra o aviso de encerramento com o ranking final quando ainda não foi visto", async () => {
    vi.mocked(obterDesafioAtivoParaCliente).mockResolvedValue(null);
    vi.mocked(obterFluxoEncerramento).mockResolvedValue({
      desafio: { id: "d1", titulo: "Glow Up" },
      clienteId: "cliente-1",
      avisoVisto: false,
      reflexaoMudou: null,
      reflexaoOrgulho: null,
      reflexaoContinuar: null,
      fotoAntesUrl: null,
      fotoDepoisUrl: null,
      rankingGeral: [{ clienteId: "cliente-2", nome: "Marina", pontos: 100 }],
    } as never);

    render(await DesafiosClientePage());

    expect(screen.getByText(/o desafio terminou/i)).toBeInTheDocument();
    expect(screen.getByText("Marina")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continuar/i })).toBeInTheDocument();
  });

  it("mostra a foto ou as iniciais de cada linha do ranking final", async () => {
    vi.mocked(obterDesafioAtivoParaCliente).mockResolvedValue(null);
    vi.mocked(obterFluxoEncerramento).mockResolvedValue({
      desafio: { id: "d1", titulo: "Glow Up" },
      clienteId: "cliente-1",
      avisoVisto: true,
      reflexaoMudou: null,
      reflexaoOrgulho: null,
      reflexaoContinuar: null,
      fotoAntesUrl: null,
      fotoDepoisUrl: null,
      rankingGeral: [
        {
          clienteId: "cliente-2",
          nome: "Marina",
          pontos: 100,
          fotoUrl: "https://exemplo/marina.jpg",
        },
        { clienteId: "cliente-3", nome: "Bia", pontos: 90, fotoUrl: null },
      ],
    } as never);

    render(await DesafiosClientePage());

    expect(screen.getByAltText("Foto de perfil de Marina")).toHaveAttribute(
      "src",
      "https://exemplo/marina.jpg",
    );
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("não mostra o aviso quando já foi visto, mas mostra fotos e reflexão salvas", async () => {
    vi.mocked(obterDesafioAtivoParaCliente).mockResolvedValue(null);
    vi.mocked(obterFluxoEncerramento).mockResolvedValue({
      desafio: { id: "d1", titulo: "Glow Up" },
      clienteId: "cliente-1",
      avisoVisto: true,
      reflexaoMudou: "Minha disciplina",
      reflexaoOrgulho: null,
      reflexaoContinuar: null,
      fotoAntesUrl: null,
      fotoDepoisUrl: null,
      rankingGeral: [],
    } as never);

    render(await DesafiosClientePage());

    expect(screen.queryByText(/o desafio terminou/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("form", { name: /salvar reflexão final/i }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("Minha disciplina")).toBeInTheDocument();
  });

  it("GESTORA/ADMIN veem o desafio ativo em modo leitura, sem botão de marcar item nem participar", async () => {
    mockAuth.mockResolvedValue({ user: { papeis: ["GESTORA"] } });
    vi.mocked(obterDesafioAtivoParaCliente).mockResolvedValue({
      desafio: {
        id: "d1",
        titulo: "Glow Up",
        fraseMotivacional: "Você é capaz",
        categorias: [
          {
            id: "c1",
            nome: "Pele",
            cor: "#f5c",
            itens: [{ id: "i1", descricao: "Hidratar", pontos: 5 }],
          },
        ],
        desafiosSurpresa: [
          {
            id: "s1",
            titulo: "Desafio bônus",
            descricao: "Poste uma foto",
            pontos: 10,
            exigeComprovacao: false,
            participacoes: [],
          },
        ],
      },
      itensMarcadosHoje: new Set(),
      rankingSemanal: [{ clienteId: "cliente-1", nome: "Marina", pontos: 8 }],
      rankingGeral: [{ clienteId: "cliente-1", nome: "Marina", pontos: 20 }],
      clienteId: "gestora-1",
      fotoAntesUrl: null,
      fotoDepoisUrl: null,
    } as never);

    render(await DesafiosClientePage());

    expect(screen.getByText("Glow Up")).toBeInTheDocument();
    expect(screen.getByText("Hidratar")).toBeInTheDocument();
    expect(screen.getByText("Marina")).toBeInTheDocument();
    expect(screen.getByText("Desafio bônus")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^marcar$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("form", { name: /participar de desafio bônus/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /minhas fotos do desafio/i }),
    ).not.toBeInTheDocument();
  });

  it("GESTORA/ADMIN veem só o ranking final no encerramento, sem aviso, reflexão ou download", async () => {
    mockAuth.mockResolvedValue({ user: { papeis: ["ADMIN"] } });
    vi.mocked(obterDesafioAtivoParaCliente).mockResolvedValue(null);
    vi.mocked(obterFluxoEncerramento).mockResolvedValue({
      desafio: { id: "d1", titulo: "Glow Up" },
      clienteId: "admin-1",
      avisoVisto: false,
      reflexaoMudou: null,
      reflexaoOrgulho: null,
      reflexaoContinuar: null,
      fotoAntesUrl: null,
      fotoDepoisUrl: null,
      rankingGeral: [{ clienteId: "cliente-2", nome: "Marina", pontos: 100 }],
    } as never);

    render(await DesafiosClientePage());

    expect(screen.getByText("Marina")).toBeInTheDocument();
    expect(screen.queryByText(/o desafio terminou/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("form", { name: /salvar reflexão final/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /baixar minha imagem/i }),
    ).not.toBeInTheDocument();
  });
});
