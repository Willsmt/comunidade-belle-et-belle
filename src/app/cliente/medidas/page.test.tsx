// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import MedidasPage from "./page";
import { listarMedidas } from "./queries";
import { criarRegistroMedida } from "./actions";

const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("./queries", () => ({
  listarMedidas: vi.fn(),
}));

vi.mock("./actions", () => ({
  criarRegistroMedida: vi.fn(),
}));

vi.mock("./grafico-evolucao", () => ({
  GraficoEvolucao: () => null,
}));

describe("MedidasPage", () => {
  beforeEach(() => {
    mockRefresh.mockClear();
    vi.mocked(listarMedidas).mockReset();
    vi.mocked(criarRegistroMedida).mockReset();
  });

  it("renderiza o formulário de novo registro", async () => {
    vi.mocked(listarMedidas).mockResolvedValue([]);

    render(await MedidasPage());

    expect(
      screen.getByRole("form", { name: /novo registro de medidas/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/peso/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /salvar registro/i }),
    ).toBeInTheDocument();
  });

  it("ao submeter: chama a action e dá refresh na rota", async () => {
    vi.mocked(listarMedidas).mockResolvedValue([]);
    vi.mocked(criarRegistroMedida).mockResolvedValue(undefined);

    render(await MedidasPage());

    fireEvent.change(screen.getByLabelText(/peso/i), {
      target: { value: "60.5" },
    });
    fireEvent.click(screen.getByRole("button", { name: /salvar registro/i }));

    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
    expect(criarRegistroMedida).toHaveBeenCalledTimes(1);
  });

  it("mostra erro se a action falhar, sem dar refresh", async () => {
    vi.mocked(listarMedidas).mockResolvedValue([]);
    vi.mocked(criarRegistroMedida).mockRejectedValue(new Error("falhou"));

    render(await MedidasPage());

    fireEvent.click(screen.getByRole("button", { name: /salvar registro/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        /não foi possível salvar/i,
      ),
    );
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
