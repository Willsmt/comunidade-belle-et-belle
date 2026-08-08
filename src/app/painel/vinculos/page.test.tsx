// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import VinculosPage from "./page";
import { listarVinculos, listarClientesEParcerias } from "./queries";

vi.mock("./queries", () => ({
  listarVinculos: vi.fn(),
  listarClientesEParcerias: vi.fn(),
}));

vi.mock("./actions", () => ({
  criarVinculo: vi.fn(),
  desativarVinculo: vi.fn(),
  reativarVinculo: vi.fn(),
}));

describe("VinculosPage", () => {
  it("renderiza o formulário com as opções de clientes e parcerias", async () => {
    vi.mocked(listarVinculos).mockResolvedValue([]);
    vi.mocked(listarClientesEParcerias).mockResolvedValue({
      clientes: [{ id: "c1", name: "Cliente 1", email: "c1@x.com" }],
      parcerias: [{ id: "p1", name: "Parceria 1", email: "p1@x.com" }],
    } as never);

    render(await VinculosPage());

    expect(
      screen.getByRole("form", { name: /criar vínculo/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Cliente 1")).toBeInTheDocument();
    expect(screen.getByText("Parceria 1")).toBeInTheDocument();
    expect(screen.getByText(/nenhum vínculo ainda/i)).toBeInTheDocument();
  });

  it("mostra vínculo ativo com botão de desativar", async () => {
    vi.mocked(listarVinculos).mockResolvedValue([
      {
        id: "v1",
        ativo: true,
        cliente: { id: "c1", name: "Cliente 1", email: "c1@x.com" },
        parceria: { id: "p1", name: "Parceria 1", email: "p1@x.com" },
      },
    ] as never);
    vi.mocked(listarClientesEParcerias).mockResolvedValue({
      clientes: [],
      parcerias: [],
    } as never);

    render(await VinculosPage());

    expect(screen.getByText("Ativo")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /desativar/i }),
    ).toBeInTheDocument();
  });

  it("mostra vínculo inativo com botão de reativar", async () => {
    vi.mocked(listarVinculos).mockResolvedValue([
      {
        id: "v1",
        ativo: false,
        cliente: { id: "c1", name: "Cliente 1", email: "c1@x.com" },
        parceria: { id: "p1", name: "Parceria 1", email: "p1@x.com" },
      },
    ] as never);
    vi.mocked(listarClientesEParcerias).mockResolvedValue({
      clientes: [],
      parcerias: [],
    } as never);

    render(await VinculosPage());

    expect(screen.getByText("Inativo")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /reativar/i }),
    ).toBeInTheDocument();
  });
});
