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
}));

describe("DesafiosClientePage", () => {
  it("mostra mensagem quando não há desafio ativo", async () => {
    vi.mocked(obterDesafioAtivoParaCliente).mockResolvedValue(null);

    render(await DesafiosClientePage());

    expect(screen.getByText(/nenhum desafio ativo/i)).toBeInTheDocument();
  });

  it("renderiza o desafio com categorias e itens, marcando os já feitos hoje", async () => {
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
      },
      itensMarcadosHoje: new Set(["i1"]),
    } as never);

    render(await DesafiosClientePage());

    expect(screen.getByText("Glow Up")).toBeInTheDocument();
    expect(screen.getByText("Você é capaz")).toBeInTheDocument();
    expect(screen.getByText("Hidratar")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /✓ marcado/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^marcar$/i })).toBeInTheDocument();
  });
});
