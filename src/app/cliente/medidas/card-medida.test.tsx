// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CardMedida } from "./card-medida";
import { editarRegistroMedida, excluirRegistroMedida } from "./actions";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("./actions", () => ({
  criarRegistroMedida: vi.fn(),
  editarRegistroMedida: vi.fn(),
  excluirRegistroMedida: vi.fn(),
}));

const VALORES = {
  data: "2026-02-01",
  peso: "60",
  altura: "165",
  ombro: "",
  peitoBusto: "",
  cintura: "70",
  abdomen: "",
  quadril: "95",
  bracoDireito: "30",
  bracoEsquerdo: "28",
  antebracoDireito: "",
  antebracoEsquerdo: "",
  punhoDireito: "",
  punhoEsquerdo: "",
  coxaDireita: "",
  coxaEsquerda: "",
  joelhoDireito: "",
  joelhoEsquerdo: "",
  panturrilhaDireita: "",
  panturrilhaEsquerda: "",
  tornozeloDireito: "",
  tornozeloEsquerdo: "",
  braco: "",
  coxa: "",
};

describe("CardMedida", () => {
  beforeEach(() => {
    vi.mocked(editarRegistroMedida).mockReset();
    vi.mocked(excluirRegistroMedida).mockReset();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("mostra os dados e os botões Editar/Excluir por padrão", () => {
    render(<CardMedida id="m1" dataFormatada="01/02/2026" valores={VALORES} />);

    expect(screen.getByText("01/02/2026")).toBeInTheDocument();
    expect(screen.getByText(/braço d\/e: 30 \/ 28 cm/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /editar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /excluir/i })).toBeInTheDocument();
  });

  it("clicar em Editar troca pro formulário, pré-preenchido; Cancelar volta pra exibição", () => {
    render(<CardMedida id="m1" dataFormatada="01/02/2026" valores={VALORES} />);

    fireEvent.click(screen.getByRole("button", { name: /editar/i }));

    expect(
      screen.getByRole("form", { name: /editar registro de medidas/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^peso/i)).toHaveValue(60);

    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));

    expect(screen.getByText("01/02/2026")).toBeInTheDocument();
    expect(
      screen.queryByRole("form", { name: /editar registro de medidas/i }),
    ).not.toBeInTheDocument();
  });

  it("salvar a edição chama editarRegistroMedida com o id e volta pra exibição", async () => {
    vi.mocked(editarRegistroMedida).mockResolvedValue(undefined);

    render(<CardMedida id="m1" dataFormatada="01/02/2026" valores={VALORES} />);

    fireEvent.click(screen.getByRole("button", { name: /editar/i }));
    fireEvent.click(screen.getByRole("button", { name: /salvar alterações/i }));

    await waitFor(() => expect(editarRegistroMedida).toHaveBeenCalledTimes(1));
    expect(editarRegistroMedida).toHaveBeenCalledWith("m1", expect.any(FormData));

    await waitFor(() =>
      expect(
        screen.queryByRole("form", { name: /editar registro de medidas/i }),
      ).not.toBeInTheDocument(),
    );
  });

  it("excluir pede confirmação e chama excluirRegistroMedida com o id", async () => {
    vi.mocked(excluirRegistroMedida).mockResolvedValue(undefined);

    render(<CardMedida id="m1" dataFormatada="01/02/2026" valores={VALORES} />);

    fireEvent.click(screen.getByRole("button", { name: /excluir/i }));

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => expect(excluirRegistroMedida).toHaveBeenCalledWith("m1"));
  });
});
