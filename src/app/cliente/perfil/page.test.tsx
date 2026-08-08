// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import PerfilPage from "./page";
import { obterPerfilProprio } from "./queries";
import { atualizarPerfil } from "./actions";

const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("./queries", () => ({
  obterPerfilProprio: vi.fn(),
}));

vi.mock("./actions", () => ({
  atualizarPerfil: vi.fn(),
}));

describe("PerfilPage", () => {
  beforeEach(() => {
    mockRefresh.mockClear();
    vi.mocked(obterPerfilProprio).mockReset();
    vi.mocked(atualizarPerfil).mockReset();
  });

  it("renderiza o formulário de edição de perfil", async () => {
    vi.mocked(obterPerfilProprio).mockResolvedValue(null);

    render(await PerfilPage());

    expect(
      screen.getByRole("form", { name: /editar perfil/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^bio/i)).toBeInTheDocument();
  });

  it("ao submeter: chama a action e dá refresh na rota", async () => {
    vi.mocked(obterPerfilProprio).mockResolvedValue(null);
    vi.mocked(atualizarPerfil).mockResolvedValue(undefined);

    render(await PerfilPage());

    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
    expect(atualizarPerfil).toHaveBeenCalledTimes(1);
  });

  it("mostra erro se a action falhar, sem dar refresh", async () => {
    vi.mocked(obterPerfilProprio).mockResolvedValue(null);
    vi.mocked(atualizarPerfil).mockRejectedValue(new Error("falhou"));

    render(await PerfilPage());

    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        /não foi possível salvar/i,
      ),
    );
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
