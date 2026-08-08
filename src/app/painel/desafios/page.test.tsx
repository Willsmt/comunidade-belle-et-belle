// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DesafiosPage from "./page";
import { listarDesafios } from "./queries";

vi.mock("./queries", () => ({
  listarDesafios: vi.fn(),
}));

vi.mock("./actions", () => ({
  criarDesafio: vi.fn(),
  encerrarDesafio: vi.fn(),
  reabrirDesafio: vi.fn(),
}));

describe("DesafiosPage", () => {
  it("renderiza o formulário de criação e a mensagem de lista vazia", async () => {
    vi.mocked(listarDesafios).mockResolvedValue([]);

    render(await DesafiosPage());

    expect(
      screen.getByRole("form", { name: /criar desafio/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/nenhum desafio criado ainda/i)).toBeInTheDocument();
  });

  it("mostra desafio ativo com botão de encerrar", async () => {
    vi.mocked(listarDesafios).mockResolvedValue([
      {
        id: "d1",
        titulo: "Glow Up",
        ativo: true,
        dataInicio: new Date("2026-09-01"),
        dataFim: new Date("2026-09-30"),
        _count: { categorias: 0 },
      },
    ] as never);

    render(await DesafiosPage());

    expect(screen.getByText("Ativo")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /encerrar/i }),
    ).toBeInTheDocument();
  });

  it("mostra desafio encerrado com botão de reabrir", async () => {
    vi.mocked(listarDesafios).mockResolvedValue([
      {
        id: "d1",
        titulo: "Glow Up",
        ativo: false,
        dataInicio: new Date("2026-09-01"),
        dataFim: new Date("2026-09-30"),
        _count: { categorias: 0 },
      },
    ] as never);

    render(await DesafiosPage());

    expect(screen.getByText("Encerrado")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /reabrir/i }),
    ).toBeInTheDocument();
  });
});
