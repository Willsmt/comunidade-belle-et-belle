// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DesafiosClientePage from "./page";
import { obterDesafioAtivoParaCliente } from "./queries";

vi.mock("./queries", () => ({
  obterDesafioAtivoParaCliente: vi.fn(),
}));

vi.mock("./actions", () => ({
  alternarMarcacao: vi.fn(),
  participarDesafioSurpresa: vi.fn(),
}));

describe("DesafiosClientePage", () => {
  it("mostra mensagem quando não há desafio ativo", async () => {
    vi.mocked(obterDesafioAtivoParaCliente).mockResolvedValue(null);

    render(await DesafiosClientePage());

    expect(screen.getByText(/nenhum desafio ativo/i)).toBeInTheDocument();
  });

  it("renderiza o desafio com categorias, itens e o ranking", async () => {
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
    } as never);

    render(await DesafiosClientePage());

    expect(screen.getByText("Glow Up")).toBeInTheDocument();
    expect(screen.getByText("Você é capaz")).toBeInTheDocument();
    expect(screen.getByText("Hidratar")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /✓ marcado/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^marcar$/i })).toBeInTheDocument();
    expect(screen.getByText("Você")).toBeInTheDocument();
    expect(screen.getByText("8 pts")).toBeInTheDocument();
    expect(screen.getByText(/nenhum desafio surpresa no momento/i)).toBeInTheDocument();
  });

  it("mostra o formulário de participação com upload quando exige comprovação e a cliente ainda não participou", async () => {
    vi.mocked(obterDesafioAtivoParaCliente).mockResolvedValue({
      desafio: {
        id: "d1",
        titulo: "Glow Up",
        fraseMotivacional: null,
        categorias: [],
        desafiosSurpresa: [
          {
            id: "s1",
            titulo: "Corrida 5km",
            descricao: "Manda o print",
            pontos: 50,
            exigeComprovacao: true,
            participacoes: [],
          },
        ],
      },
      itensMarcadosHoje: new Set(),
      rankingSemanal: [],
      rankingGeral: [],
      clienteId: "cliente-1",
    } as never);

    render(await DesafiosClientePage());

    expect(screen.getByText("Corrida 5km")).toBeInTheDocument();
    expect(
      screen.getByRole("form", { name: /participar de corrida 5km/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/foto de comprovação/i)).toBeInTheDocument();
  });

  it("mostra 'aguardando validação' quando já participou e ainda não foi aprovada", async () => {
    vi.mocked(obterDesafioAtivoParaCliente).mockResolvedValue({
      desafio: {
        id: "d1",
        titulo: "Glow Up",
        fraseMotivacional: null,
        categorias: [],
        desafiosSurpresa: [
          {
            id: "s1",
            titulo: "Corrida 5km",
            descricao: null,
            pontos: 50,
            exigeComprovacao: false,
            participacoes: [{ id: "p1", validado: false }],
          },
        ],
      },
      itensMarcadosHoje: new Set(),
      rankingSemanal: [],
      rankingGeral: [],
      clienteId: "cliente-1",
    } as never);

    render(await DesafiosClientePage());

    expect(screen.getByText(/aguardando validação da patty/i)).toBeInTheDocument();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
  });

  it("mostra 'participação aprovada' quando validado", async () => {
    vi.mocked(obterDesafioAtivoParaCliente).mockResolvedValue({
      desafio: {
        id: "d1",
        titulo: "Glow Up",
        fraseMotivacional: null,
        categorias: [],
        desafiosSurpresa: [
          {
            id: "s1",
            titulo: "Corrida 5km",
            descricao: null,
            pontos: 50,
            exigeComprovacao: false,
            participacoes: [{ id: "p1", validado: true }],
          },
        ],
      },
      itensMarcadosHoje: new Set(),
      rankingSemanal: [],
      rankingGeral: [],
      clienteId: "cliente-1",
    } as never);

    render(await DesafiosClientePage());

    expect(screen.getByText(/participação aprovada/i)).toBeInTheDocument();
  });
});
