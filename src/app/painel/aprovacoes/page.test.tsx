// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AprovacoesPage from "./page";
import { listarPendentes } from "./queries";
import { aprovarConta, rejeitarConta } from "./actions";

vi.mock("./queries", () => ({
  listarPendentes: vi.fn(),
}));

vi.mock("./actions", () => ({
  aprovarConta: vi.fn(),
  rejeitarConta: vi.fn(),
}));

describe("AprovacoesPage", () => {
  beforeEach(() => {
    vi.mocked(listarPendentes).mockReset();
    vi.mocked(aprovarConta).mockReset();
    vi.mocked(rejeitarConta).mockReset();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("mostra a mensagem de vazio quando não há pendentes", async () => {
    vi.mocked(listarPendentes).mockResolvedValue([]);

    render(await AprovacoesPage());

    expect(screen.getByText(/nenhum pedido pendente/i)).toBeInTheDocument();
  });

  it("aprova a conta ao clicar em Aprovar", async () => {
    vi.mocked(listarPendentes).mockResolvedValue([
      { id: "user-1", name: "Fulana", email: "fulana@x.com" } as never,
    ]);
    vi.mocked(aprovarConta).mockResolvedValue(undefined);

    render(await AprovacoesPage());

    fireEvent.click(screen.getByRole("button", { name: /aprovar/i }));

    await waitFor(() => expect(aprovarConta).toHaveBeenCalledWith("user-1"));
  });

  it("mostra a mensagem de erro original quando aprovar falha", async () => {
    vi.mocked(listarPendentes).mockResolvedValue([
      { id: "user-1", name: "Fulana", email: "fulana@x.com" } as never,
    ]);
    vi.mocked(aprovarConta).mockRejectedValue(new Error("Acesso negado"));

    render(await AprovacoesPage());

    fireEvent.click(screen.getByRole("button", { name: /aprovar/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Acesso negado"),
    );
  });

  it("pede confirmação e rejeita a conta ao clicar em Rejeitar", async () => {
    vi.mocked(listarPendentes).mockResolvedValue([
      { id: "user-1", name: "Fulana", email: "fulana@x.com" } as never,
    ]);
    vi.mocked(rejeitarConta).mockResolvedValue(undefined);

    render(await AprovacoesPage());

    fireEvent.click(screen.getByRole("button", { name: /rejeitar/i }));

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => expect(rejeitarConta).toHaveBeenCalledWith("user-1"));
  });
});
