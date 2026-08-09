// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ParceriasPage from "./page";
import { listarParceriasVinculadas } from "./queries";

vi.mock("./queries", () => ({
  listarParceriasVinculadas: vi.fn(),
}));

describe("ParceriasPage", () => {
  it("mostra mensagem de vazio quando não há parceria vinculada", async () => {
    vi.mocked(listarParceriasVinculadas).mockResolvedValue([]);

    render(await ParceriasPage());

    expect(
      screen.getByText(/nenhuma parceria vinculada ainda/i),
    ).toBeInTheDocument();
  });

  it("lista as parcerias vinculadas com especialidade e bio", async () => {
    vi.mocked(listarParceriasVinculadas).mockResolvedValue([
      {
        id: "parceria-1",
        nome: "Fulana Nutri",
        especialidade: "Nutrição",
        bio: "Cuido de dieta",
        fotoUrl: "https://url-assinada.exemplo",
      },
    ]);

    render(await ParceriasPage());

    expect(screen.getByText("Fulana Nutri")).toBeInTheDocument();
    expect(screen.getByText("Nutrição")).toBeInTheDocument();
    expect(screen.getByText("Cuido de dieta")).toBeInTheDocument();
    expect(screen.getByAltText(/foto de fulana nutri/i)).toBeInTheDocument();
  });
});
