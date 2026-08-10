// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import PerfilPage from "./page";
import { redirect } from "next/navigation";
import { obterPerfilProprio } from "./queries";
import { atualizarPerfil } from "./actions";
import { gerarUrlAssinada } from "@/lib/storage/perfil";

const { mockRefresh, mockAuth } = vi.hoisted(() => ({
  mockRefresh: vi.fn(),
  mockAuth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("@/auth", () => ({ auth: mockAuth }));

vi.mock("./queries", () => ({
  obterPerfilProprio: vi.fn(),
}));

vi.mock("./actions", () => ({
  atualizarPerfil: vi.fn(),
}));

vi.mock("@/lib/storage/perfil", () => ({
  gerarUrlAssinada: vi.fn(),
}));

describe("PerfilPage", () => {
  beforeEach(() => {
    mockRefresh.mockClear();
    vi.mocked(obterPerfilProprio).mockReset();
    vi.mocked(atualizarPerfil).mockReset();
    mockAuth.mockReset();
    mockAuth.mockResolvedValue({ user: { papeis: ["CLIENTE"], name: "Cliente Teste" } });
    vi.mocked(gerarUrlAssinada).mockReset();
  });

  it("renderiza o formulário de edição de perfil", async () => {
    vi.mocked(obterPerfilProprio).mockResolvedValue(null);

    render(await PerfilPage());

    expect(
      screen.getByRole("form", { name: /editar perfil/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^bio/i)).toBeInTheDocument();
  });

  it("preenche o nome de exibição com o nome atual da sessão", async () => {
    vi.mocked(obterPerfilProprio).mockResolvedValue(null);

    render(await PerfilPage());

    expect(screen.getByLabelText(/nome de exibição/i)).toHaveValue(
      "Cliente Teste",
    );
  });

  it("mostra a foto atual quando o perfil já tem fotoChave", async () => {
    vi.mocked(obterPerfilProprio).mockResolvedValue({
      id: "perfil-1",
      userId: "cliente-1",
      bio: null,
      fotoChave: "perfis-cliente/cliente-1/foto.webp",
      bioPublica: false,
      emblemasPublicos: true,
      medidasPublicas: false,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    });
    vi.mocked(gerarUrlAssinada).mockResolvedValue("https://url-assinada.exemplo");

    render(await PerfilPage());

    expect(gerarUrlAssinada).toHaveBeenCalledWith(
      "perfis-cliente/cliente-1/foto.webp",
    );
    expect(screen.getByAltText(/foto de perfil atual/i)).toBeInTheDocument();
  });

  it("não busca signed URL quando o perfil ainda não tem fotoChave", async () => {
    vi.mocked(obterPerfilProprio).mockResolvedValue(null);

    render(await PerfilPage());

    expect(gerarUrlAssinada).not.toHaveBeenCalled();
    expect(
      screen.queryByAltText(/foto de perfil atual/i),
    ).not.toBeInTheDocument();
  });

  it("ao submeter: chama a action e dá refresh na rota", async () => {
    vi.mocked(obterPerfilProprio).mockResolvedValue(null);
    vi.mocked(atualizarPerfil).mockResolvedValue(undefined);

    render(await PerfilPage());

    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
    expect(atualizarPerfil).toHaveBeenCalledTimes(1);
  });

  it("mostra mensagem de sucesso após salvar", async () => {
    vi.mocked(obterPerfilProprio).mockResolvedValue(null);
    vi.mocked(atualizarPerfil).mockResolvedValue(undefined);

    render(await PerfilPage());

    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        /perfil atualizado/i,
      ),
    );
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

  it("redireciona quem não tem papel CLIENTE, sem buscar o perfil", async () => {
    mockAuth.mockResolvedValue({ user: { papeis: ["GESTORA"] } });

    await expect(PerfilPage()).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/");
    expect(obterPerfilProprio).not.toHaveBeenCalled();
  });
});
