// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import FotosPage from "./page";
import { listarFotos } from "./queries";
import { enviarFoto, alternarVisibilidadeFoto, excluirFoto } from "./actions";

const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("./queries", () => ({
  listarFotos: vi.fn(),
}));

vi.mock("./actions", () => ({
  enviarFoto: vi.fn(),
  alternarVisibilidadeFoto: vi.fn(),
  excluirFoto: vi.fn(),
}));

describe("FotosPage", () => {
  beforeEach(() => {
    mockRefresh.mockClear();
    vi.mocked(listarFotos).mockReset();
    vi.mocked(enviarFoto).mockReset();
  });

  it("renderiza o formulário de upload e o estado vazio da galeria", async () => {
    vi.mocked(listarFotos).mockResolvedValue([]);

    render(await FotosPage());

    expect(
      screen.getByRole("form", { name: /enviar foto de evolução/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/nenhuma foto ainda/i)).toBeInTheDocument();
  });

  it("ao enviar uma foto: chama a action e dá refresh na rota", async () => {
    vi.mocked(listarFotos).mockResolvedValue([]);
    vi.mocked(enviarFoto).mockResolvedValue(undefined);

    render(await FotosPage());

    const input = screen.getByLabelText(/^foto$/i) as HTMLInputElement;
    const arquivo = new File(["conteudo"], "foto.jpg", { type: "image/jpeg" });
    fireEvent.change(input, { target: { files: [arquivo] } });
    fireEvent.click(screen.getByRole("button", { name: /enviar foto/i }));

    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
    expect(enviarFoto).toHaveBeenCalledTimes(1);
  });

  it("mostra a foto com rótulo de visibilidade e os botões de alternar/excluir", async () => {
    vi.mocked(listarFotos).mockResolvedValue([
      {
        id: "foto-1",
        clienteId: "cliente-1",
        chave: "chave-1",
        data: new Date("2026-02-01"),
        publica: true,
        criadoEm: new Date("2026-02-01"),
        urlAssinada: "https://exemplo/foto-1",
      } as never,
    ]);

    render(await FotosPage());

    expect(screen.getByText("Pública")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /tornar privada/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /excluir/i })).toBeInTheDocument();
  });

  it("mostra a mensagem de erro original quando alternar a visibilidade falha", async () => {
    vi.mocked(listarFotos).mockResolvedValue([
      {
        id: "foto-1",
        clienteId: "cliente-1",
        chave: "chave-1",
        data: new Date("2026-02-01"),
        publica: true,
        criadoEm: new Date("2026-02-01"),
        urlAssinada: "https://exemplo/foto-1",
      } as never,
    ]);
    vi.mocked(alternarVisibilidadeFoto).mockRejectedValue(
      new Error("Foto não encontrada"),
    );

    render(await FotosPage());

    fireEvent.click(screen.getByRole("button", { name: /tornar privada/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Foto não encontrada"),
    );
  });

  it("pede confirmação e mostra a mensagem de erro original quando excluir falha", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(listarFotos).mockResolvedValue([
      {
        id: "foto-1",
        clienteId: "cliente-1",
        chave: "chave-1",
        data: new Date("2026-02-01"),
        publica: true,
        criadoEm: new Date("2026-02-01"),
        urlAssinada: "https://exemplo/foto-1",
      } as never,
    ]);
    vi.mocked(excluirFoto).mockRejectedValue(new Error("Foto não encontrada"));

    render(await FotosPage());

    fireEvent.click(screen.getByRole("button", { name: /excluir/i }));

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Foto não encontrada"),
    );
  });
});
