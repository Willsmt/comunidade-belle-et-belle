// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PlanosRecebidosPage from "./page";
import { redirect } from "next/navigation";
import { listarPlanosRecebidos } from "./queries";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));
vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("./queries", () => ({
  listarPlanosRecebidos: vi.fn(),
}));

describe("PlanosRecebidosPage", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockAuth.mockResolvedValue({ user: { papeis: ["CLIENTE"] } });
    vi.mocked(listarPlanosRecebidos).mockReset();
  });

  it("mostra estado vazio quando não há planos recebidos", async () => {
    vi.mocked(listarPlanosRecebidos).mockResolvedValue([]);
    render(await PlanosRecebidosPage());
    expect(screen.getByText(/nenhum plano recebido ainda/i)).toBeInTheDocument();
  });
  it("mostra o link para o diretório de parcerias, mesmo sem planos", async () => {
    vi.mocked(listarPlanosRecebidos).mockResolvedValue([]);
    render(await PlanosRecebidosPage());
    expect(
      screen.getByRole("link", { name: /ver minhas parcerias/i }),
    ).toHaveAttribute("href", "/cliente/parcerias");
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

  it("redireciona quem não tem papel CLIENTE, sem buscar os planos", async () => {
    mockAuth.mockResolvedValue({ user: { papeis: ["GESTORA"] } });

    await expect(PlanosRecebidosPage()).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/");
    expect(listarPlanosRecebidos).not.toHaveBeenCalled();
  });
});
