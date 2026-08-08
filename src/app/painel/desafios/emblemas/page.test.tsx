// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import EmblemasPage from "./page";
import { listarEmblemas } from "./queries";

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
});
