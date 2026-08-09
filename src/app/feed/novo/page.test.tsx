// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("../queries", () => ({
  listarFotosEvolucaoDoUsuario: vi.fn(),
}));
vi.mock("../actions", () => ({
  criarPost: vi.fn(),
}));

import NovoPostPage from "./page";
import { listarFotosEvolucaoDoUsuario } from "../queries";

describe("NovoPostPage", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    vi.mocked(listarFotosEvolucaoDoUsuario).mockReset();
  });

  it("renderiza o formulário sem buscar fotos quando não há sessão", async () => {
    mockAuth.mockResolvedValue(null);

    render(await NovoPostPage());

    expect(screen.getByLabelText(/texto/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/ou escolha uma foto de evolução/i),
    ).not.toBeInTheDocument();
    expect(listarFotosEvolucaoDoUsuario).not.toHaveBeenCalled();
  });

  it("não mostra o fieldset de fotos quando o usuário não tem nenhuma", async () => {
    mockAuth.mockResolvedValue({ user: { id: "cliente-1" } });
    vi.mocked(listarFotosEvolucaoDoUsuario).mockResolvedValue([]);

    render(await NovoPostPage());

    expect(
      screen.queryByText(/ou escolha uma foto de evolução/i),
    ).not.toBeInTheDocument();
  });

  it("mostra as fotos de evolução do usuário como opções de rádio", async () => {
    mockAuth.mockResolvedValue({ user: { id: "cliente-1" } });
    vi.mocked(listarFotosEvolucaoDoUsuario).mockResolvedValue([
      {
        id: "foto-1",
        clienteId: "cliente-1",
        chave: "chave-1",
        data: new Date(),
        publica: true,
        criadoEm: new Date(),
        urlAssinada: "https://exemplo/foto-1",
      } as never,
    ]);

    render(await NovoPostPage());

    expect(
      screen.getByText(/ou escolha uma foto de evolução já enviada/i),
    ).toBeInTheDocument();
    expect(screen.getByAltText("Foto de evolução")).toBeInTheDocument();
  });
});
