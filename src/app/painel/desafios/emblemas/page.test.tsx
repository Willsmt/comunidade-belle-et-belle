// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import EmblemasPage from "./page";
import { listarEmblemas } from "./queries";
import { criarEmblema } from "./actions";

vi.mock("./queries", () => ({
  listarEmblemas: vi.fn(),
}));

vi.mock("./actions", () => ({
  criarEmblema: vi.fn(),
  removerEmblema: vi.fn(),
}));

describe("EmblemasPage", () => {
  it("renderiza o formulário e a mensagem de catálogo vazio", async () => {
    vi.mocked(listarEmblemas).mockResolvedValue([]);

    render(await EmblemasPage());

    expect(
      screen.getByRole("form", { name: /criar emblema/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/nenhum emblema criado ainda/i)).toBeInTheDocument();
  });

  it("renderiza os emblemas existentes com botão de remover", async () => {
    vi.mocked(listarEmblemas).mockResolvedValue([
      { id: "e1", nome: "Campeã da Semana", descricao: "Venceu o ranking semanal", icone: "🏆" },
    ] as never);

    render(await EmblemasPage());

    expect(screen.getByText("Campeã da Semana")).toBeInTheDocument();
    expect(screen.getByText("Venceu o ranking semanal")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /remover/i })).toBeInTheDocument();
  });

  it("mostra a mensagem de erro original quando criar emblema falha", async () => {
    vi.mocked(listarEmblemas).mockResolvedValue([]);
    vi.mocked(criarEmblema).mockRejectedValue(new Error("Informe o nome do emblema"));

    render(await EmblemasPage());

    fireEvent.submit(screen.getByRole("form", { name: /criar emblema/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Informe o nome do emblema",
      ),
    );
  });
});
