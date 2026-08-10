// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ParceriasPage from "./page";
import { redirect } from "next/navigation";
import { listarParceriasVinculadas } from "./queries";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));
vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("./queries", () => ({
  listarParceriasVinculadas: vi.fn(),
}));

describe("ParceriasPage", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockAuth.mockResolvedValue({ user: { papeis: ["CLIENTE"] } });
    vi.mocked(listarParceriasVinculadas).mockReset();
  });

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

  it("redireciona quem não tem papel CLIENTE, sem buscar as parcerias", async () => {
    mockAuth.mockResolvedValue({ user: { papeis: ["GESTORA"] } });

    await expect(ParceriasPage()).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/");
    expect(listarParceriasVinculadas).not.toHaveBeenCalled();
  });
});
