// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import DesafioDetalhePage from "./page";
import { obterDesafioComCategorias } from "./queries";

vi.mock("./queries", () => ({
  obterDesafioComCategorias: vi.fn(),
}));

vi.mock("./actions", () => ({
  criarCategoria: vi.fn(),
  removerCategoria: vi.fn(),
  criarItem: vi.fn(),
  removerItem: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

describe("DesafioDetalhePage", () => {
  it("chama notFound quando o desafio não existe", async () => {
    vi.mocked(obterDesafioComCategorias).mockResolvedValue(null);

    await expect(
      DesafioDetalhePage({ params: Promise.resolve({ desafioId: "d1" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renderiza o título, o formulário de categoria e a mensagem de lista vazia", async () => {
    vi.mocked(obterDesafioComCategorias).mockResolvedValue({
      id: "d1",
      titulo: "Glow Up",
      ativo: true,
      categorias: [],
    } as never);

    render(await DesafioDetalhePage({ params: Promise.resolve({ desafioId: "d1" }) }));

    expect(screen.getByText("Glow Up")).toBeInTheDocument();
    expect(
      screen.getByRole("form", { name: /criar categoria/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/nenhuma categoria ainda/i)).toBeInTheDocument();
  });

  it("renderiza categoria com seus itens e o form de novo item", async () => {
    vi.mocked(obterDesafioComCategorias).mockResolvedValue({
      id: "d1",
      titulo: "Glow Up",
      ativo: true,
      categorias: [
        {
          id: "c1",
          nome: "Pele",
          cor: "#f5c",
          itens: [
            { id: "i1", descricao: "Hidratar", pontos: 5, frequencia: "DIARIO" },
          ],
        },
      ],
    } as never);

    render(await DesafioDetalhePage({ params: Promise.resolve({ desafioId: "d1" }) }));

    const itemRow = screen.getByRole("listitem");
    expect(within(itemRow).getByText("Hidratar")).toBeInTheDocument();
    expect(within(itemRow).getByText("5 pts")).toBeInTheDocument();
    expect(within(itemRow).getByText("Diário")).toBeInTheDocument();
    expect(
      screen.getByRole("form", { name: /criar item em pele/i }),
    ).toBeInTheDocument();
  });
});
