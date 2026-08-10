// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import PerfilPage from "./page";
import { redirect } from "next/navigation";
import { obterPerfilProprio } from "./queries";
import { atualizarPerfil } from "./actions";

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

describe("PerfilPage", () => {
  beforeEach(() => {
    mockRefresh.mockClear();
    vi.mocked(obterPerfilProprio).mockReset();
    vi.mocked(atualizarPerfil).mockReset();
    mockAuth.mockReset();
    mockAuth.mockResolvedValue({ user: { papeis: ["CLIENTE"] } });
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

  it("redireciona quem não tem papel CLIENTE, sem buscar o perfil", async () => {
    mockAuth.mockResolvedValue({ user: { papeis: ["GESTORA"] } });

    await expect(PerfilPage()).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/");
    expect(obterPerfilProprio).not.toHaveBeenCalled();
  });
});
