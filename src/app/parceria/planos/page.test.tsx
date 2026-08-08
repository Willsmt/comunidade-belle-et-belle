// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PlanosPage from "./page";
import { listarClientesVinculadas, listarPlanosEnviados } from "./queries";

const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("./queries", () => ({
  listarClientesVinculadas: vi.fn(),
  listarPlanosEnviados: vi.fn(),
}));

vi.mock("./actions", () => ({
  enviarPlano: vi.fn(),
}));

describe("PlanosPage", () => {
  it("mostra aviso quando não há cliente vinculada, sem exibir o formulário", async () => {
    vi.mocked(listarClientesVinculadas).mockResolvedValue([]);
    vi.mocked(listarPlanosEnviados).mockResolvedValue([]);

    render(await PlanosPage());

    expect(
      screen.getByText(/nenhuma cliente vinculada a você ainda/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
  });

  it("renderiza o formulário com as clientes vinculadas", async () => {
    vi.mocked(listarClientesVinculadas).mockResolvedValue([
      { id: "c1", name: "Cliente 1", email: "c1@x.com" },
    ]);
    vi.mocked(listarPlanosEnviados).mockResolvedValue([]);

    render(await PlanosPage());

    expect(
      screen.getByRole("form", { name: /enviar plano/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Cliente 1")).toBeInTheDocument();
  });

  it("renderiza o histórico de planos enviados", async () => {
    vi.mocked(listarClientesVinculadas).mockResolvedValue([]);
    vi.mocked(listarPlanosEnviados).mockResolvedValue([
      {
        id: "p1",
        tipo: "TREINO",
        titulo: "Fase 2",
        enviadoEm: new Date("2026-02-01"),
        cliente: { id: "c1", name: "Cliente 1", email: "c1@x.com" },
      } as never,
    ]);

    render(await PlanosPage());

    expect(screen.getByText("Cliente 1")).toBeInTheDocument();
    expect(screen.getByText("Treino")).toBeInTheDocument();
    expect(screen.getByText("Fase 2")).toBeInTheDocument();
  });
});
