// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useSession } from "next-auth/react";
import BemVindaPage from "./page";
import { aceitarTermo } from "./actions";

const mockUpdate = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("./actions", () => ({
  aceitarTermo: vi.fn(),
}));

vi.mock("@/lib/auth/actions", () => ({
  sair: vi.fn(),
}));

describe("BemVindaPage", () => {
  beforeEach(() => {
    mockUpdate.mockClear();
    mockRefresh.mockClear();
    vi.mocked(aceitarTermo).mockReset();
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { status: "ATIVO", temConsentimento: false },
        expires: new Date().toISOString(),
      },
      status: "authenticated",
      update: mockUpdate,
    } as unknown as ReturnType<typeof useSession>);
  });

  it("mostra o termo e o botão de aceite", () => {
    render(<BemVindaPage />);
    expect(screen.getByText(/bem-vinda à comunidade/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /aceito, continuar/i }),
    ).toBeInTheDocument();
  });

  it("ao aceitar: chama a action, atualiza a sessão e dá refresh na rota", async () => {
    vi.mocked(aceitarTermo).mockResolvedValue({ ok: true });
    render(<BemVindaPage />);

    fireEvent.click(screen.getByRole("button", { name: /aceito, continuar/i }));

    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
    expect(aceitarTermo).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  it("mostra erro se a action falhar, sem atualizar sessão", async () => {
    vi.mocked(aceitarTermo).mockRejectedValue(new Error("falhou"));
    render(<BemVindaPage />);

    fireEvent.click(screen.getByRole("button", { name: /aceito, continuar/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        /não foi possível registrar/i,
      ),
    );
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
