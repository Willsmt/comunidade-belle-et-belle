// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PerfilPublicoPage from "./page";
import { obterPerfilPublico } from "./queries";

vi.mock("./queries", () => ({
  obterPerfilPublico: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

function buildParams(clienteId: string) {
  return Promise.resolve({ clienteId });
}

describe("PerfilPublicoPage", () => {
  it("chama notFound quando o perfil não existe", async () => {
    vi.mocked(obterPerfilPublico).mockResolvedValue(null);

    await expect(
      PerfilPublicoPage({ params: buildParams("nao-existe") }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renderiza nome, bio e medida quando presentes", async () => {
    vi.mocked(obterPerfilPublico).mockResolvedValue({
      nome: "Cliente 1",
      bio: "Oi, sou eu",
      emblemasPublicos: true,
      conquistas: [],
      ultimaMedida: { peso: { toString: () => "60" } } as never,
      fotos: [],
    });

    render(await PerfilPublicoPage({ params: buildParams("cliente-1") }));

    expect(screen.getByText("Cliente 1")).toBeInTheDocument();
    expect(screen.getByText("Oi, sou eu")).toBeInTheDocument();
    expect(screen.getByText("Nenhum emblema ainda")).toBeInTheDocument();
    expect(screen.getByText(/Peso: 60 kg/)).toBeInTheDocument();
  });

  it("mostra 'Emblemas privados' quando emblemasPublicos é false", async () => {
    vi.mocked(obterPerfilPublico).mockResolvedValue({
      nome: "Cliente 2",
      bio: null,
      emblemasPublicos: false,
      conquistas: [],
      ultimaMedida: null,
      fotos: [],
    });

    render(await PerfilPublicoPage({ params: buildParams("cliente-2") }));

    expect(screen.getByText("Emblemas privados")).toBeInTheDocument();
  });

  it("renderiza a lista de emblemas quando emblemasPublicos é true e há conquistas", async () => {
    vi.mocked(obterPerfilPublico).mockResolvedValue({
      nome: "Cliente 4",
      bio: null,
      emblemasPublicos: true,
      conquistas: [
        { id: "c1", nome: "Campeã da Semana", icone: "🏆", descricao: "Venceu a semana" },
      ],
      ultimaMedida: null,
      fotos: [],
    });

    render(await PerfilPublicoPage({ params: buildParams("cliente-4") }));

    expect(screen.getByText("Campeã da Semana")).toBeInTheDocument();
    expect(screen.getByText("🏆")).toBeInTheDocument();
    expect(screen.getByText("Venceu a semana")).toBeInTheDocument();
    expect(screen.queryByText("Nenhum emblema ainda")).not.toBeInTheDocument();
  });

  it("renderiza as fotos públicas quando existem", async () => {
    vi.mocked(obterPerfilPublico).mockResolvedValue({
      nome: "Cliente 3",
      bio: null,
      emblemasPublicos: true,
      conquistas: [],
      ultimaMedida: null,
      fotos: [
        { id: "foto-1", data: new Date(), urlAssinada: "https://exemplo/foto-1" },
      ],
    });

    render(await PerfilPublicoPage({ params: buildParams("cliente-3") }));

    expect(screen.getByAltText("Foto de evolução")).toBeInTheDocument();
  });
});
