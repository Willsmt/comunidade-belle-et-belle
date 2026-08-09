// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import PerfilParceriaPage from "./page";
import { obterPerfilParceriaProprio } from "./queries";
import { atualizarPerfilParceria } from "./actions";
import { gerarUrlAssinada } from "@/lib/storage/parcerias";

const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("./queries", () => ({
  obterPerfilParceriaProprio: vi.fn(),
}));

vi.mock("./actions", () => ({
  atualizarPerfilParceria: vi.fn(),
}));

vi.mock("@/lib/storage/parcerias", () => ({
  gerarUrlAssinada: vi.fn(),
}));

describe("PerfilParceriaPage", () => {
  beforeEach(() => {
    mockRefresh.mockClear();
    vi.mocked(obterPerfilParceriaProprio).mockReset();
    vi.mocked(atualizarPerfilParceria).mockReset();
    vi.mocked(gerarUrlAssinada).mockReset();
  });

  it("renderiza o formulário sem foto quando o perfil ainda não tem uma", async () => {
    vi.mocked(obterPerfilParceriaProprio).mockResolvedValue(null);

    render(await PerfilParceriaPage());

    expect(
      screen.getByRole("form", { name: /editar perfil da parceria/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/especialidade/i)).toBeInTheDocument();
    expect(
      screen.queryByAltText(/foto de perfil atual/i),
    ).not.toBeInTheDocument();
    expect(gerarUrlAssinada).not.toHaveBeenCalled();
  });

  it("mostra a foto atual quando o perfil já tem fotoChave", async () => {
    vi.mocked(obterPerfilParceriaProprio).mockResolvedValue({
      id: "perfil-1",
      usuarioId: "parceria-1",
      especialidade: "Nutrição",
      bio: null,
      fotoChave: "perfis-parceria/parceria-1/foto.webp",
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    });
    vi.mocked(gerarUrlAssinada).mockResolvedValue("https://url-assinada.exemplo");

    render(await PerfilParceriaPage());

    expect(gerarUrlAssinada).toHaveBeenCalledWith(
      "perfis-parceria/parceria-1/foto.webp",
    );
    expect(screen.getByAltText(/foto de perfil atual/i)).toBeInTheDocument();
  });

  it("ao submeter: chama a action e dá refresh na rota", async () => {
    vi.mocked(obterPerfilParceriaProprio).mockResolvedValue(null);
    vi.mocked(atualizarPerfilParceria).mockResolvedValue(undefined);

    render(await PerfilParceriaPage());

    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
    expect(atualizarPerfilParceria).toHaveBeenCalledTimes(1);
  });

  it("mostra erro se a action falhar, sem dar refresh", async () => {
    vi.mocked(obterPerfilParceriaProprio).mockResolvedValue(null);
    vi.mocked(atualizarPerfilParceria).mockRejectedValue(new Error("falhou"));

    render(await PerfilParceriaPage());

    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        /não foi possível salvar/i,
      ),
    );
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
