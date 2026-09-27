// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import MedidasParceriaPage from "./page";
import { listarClientesVinculadas } from "./queries";

vi.mock("./queries", () => ({
  listarClientesVinculadas: vi.fn(),
}));

describe("MedidasParceriaPage", () => {
  it("mostra aviso quando não há cliente vinculada", async () => {
    vi.mocked(listarClientesVinculadas).mockResolvedValue([]);

    render(await MedidasParceriaPage());

    expect(
      screen.getByText(/nenhuma cliente vinculada a você ainda/i),
    ).toBeInTheDocument();
  });

  it("lista as clientes vinculadas, cada uma como link para o detalhe", async () => {
    vi.mocked(listarClientesVinculadas).mockResolvedValue([
      { id: "c1", name: "Cliente 1", email: "c1@x.com" },
      { id: "c2", name: null, email: "c2@x.com" },
    ]);

    render(await MedidasParceriaPage());

    const link1 = screen.getByRole("link", { name: "Cliente 1" });
    expect(link1).toHaveAttribute("href", "/parceria/medidas/c1");

    const link2 = screen.getByRole("link", { name: "c2@x.com" });
    expect(link2).toHaveAttribute("href", "/parceria/medidas/c2");
  });
});
