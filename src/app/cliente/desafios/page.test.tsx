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
  enviarFotoAntes: vi.fn(),
  enviarFotoDepois: vi.fn(),
}));

describe("DesafiosClientePage", () => {
  it("mostra mensagem quando não há desafio ativo", async () => {
    vi.mocked(obterDesafioAtivoParaCliente).mockResolvedValue(null);

    render(await DesafiosClientePage());

    expect(screen.getByText(/nenhum desafio ativo/i)).toBeInTheDocument();
  });

  it("renderiza o desafio com categorias, itens, ranking e a seção de fotos vazia", async () => {
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
    expect(
      screen.getByRole("form", { name: /enviar foto de antes/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("form", { name: /enviar foto de depois/i }),
    ).toBeInTheDocument();
  });

  it("renderiza as fotos já enviadas e o botão vira 'Trocar foto'", async () => {
    vi.mocked(obterDesafioAtivoParaCliente).mockResolvedValue({
      desafio: {
        id: "d1",
        titulo: "Glow Up",
        fraseMotivacional: null,
        categorias: [],
        desafiosSurpresa: [],
      },
      itensMarcadosHoje: new Set(),
      rankingSemanal: [],
      rankingGeral: [],
      clienteId: "cliente-1",
      fotoAntesUrl: "https://exemplo/antes.webp",
      fotoDepoisUrl: "https://exemplo/depois.webp",
    } as never);

    render(await DesafiosClientePage());

    expect(screen.getByAltText("Foto de antes")).toBeInTheDocument();
    expect(screen.getByAltText("Foto de depois")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /trocar foto/i })).toHaveLength(2);
  });
});
