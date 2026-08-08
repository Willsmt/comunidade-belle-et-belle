// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PlanosRecebidosPage from "./page";
import { listarPlanosRecebidos } from "./queries";

vi.mock("./queries", () => ({
  listarPlanosRecebidos: vi.fn(),
}));

describe("PlanosRecebidosPage", () => {
  it("mostra estado vazio quando não há planos recebidos", async () => {
    vi.mocked(listarPlanosRecebidos).mockResolvedValue([]);

    render(await PlanosRecebidosPage());

    expect(screen.getByText(/nenhum plano recebido ainda/i)).toBeInTheDocument();
  });

  it("renderiza cada plano com tipo, título, parceria e link pro PDF", async () => {
    vi.mocked(listarPlanosRecebidos).mockResolvedValue([
      {
        id: "p1",
        tipo: "DIETA",
        titulo: "Fase 2",
        enviadoEm: new Date("2026-02-01"),
        parceria: { id: "parceria-1", name: "Nutri Ana", email: "ana@x.com" },
        urlAssinada: "https://exemplo/plano.pdf",
      } as never,
    ]);

    render(await PlanosRecebidosPage());

    expect(screen.getByText("Dieta")).toBeInTheDocument();
    expect(screen.getByText("Fase 2")).toBeInTheDocument();
    expect(screen.getByText("Nutri Ana")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ver pdf/i })).toHaveAttribute(
      "href",
      "https://exemplo/plano.pdf",
    );
  });
});
