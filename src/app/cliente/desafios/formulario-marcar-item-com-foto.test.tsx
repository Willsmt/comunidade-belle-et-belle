// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FormularioMarcarItemComFoto } from "./formulario-marcar-item-com-foto";
import { marcarItemComFoto } from "./actions";

vi.mock("./actions", () => ({
  marcarItemComFoto: vi.fn(),
}));

const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();

beforeEach(() => {
  vi.mocked(marcarItemComFoto).mockReset();
  mockCreateObjectURL.mockReset();
  mockRevokeObjectURL.mockReset();
  let contador = 0;
  mockCreateObjectURL.mockImplementation(() => `blob:preview-${++contador}`);
  URL.createObjectURL = mockCreateObjectURL;
  URL.revokeObjectURL = mockRevokeObjectURL;
});

function selecionarArquivo(input: HTMLElement, nome: string) {
  const arquivo = new File(["conteudo"], nome, { type: "image/png" });
  fireEvent.change(input, { target: { files: [arquivo] } });
  return arquivo;
}

describe("FormularioMarcarItemComFoto", () => {
  it("sem nenhuma foto selecionada, não mostra preview nem o botão de confirmar", () => {
    render(<FormularioMarcarItemComFoto itemId="i1" descricao="Ida à academia" />);

    expect(screen.queryByAltText("Prévia da foto selecionada")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /confirmar/i })).not.toBeInTheDocument();
  });

  it("ao selecionar uma foto, mostra o preview e o botão de confirmar", () => {
    render(<FormularioMarcarItemComFoto itemId="i1" descricao="Ida à academia" />);

    const input = screen.getByLabelText("Foto", { selector: "input" });
    selecionarArquivo(input, "foto1.png");

    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
    expect(screen.getByAltText("Prévia da foto selecionada")).toHaveAttribute(
      "src",
      "blob:preview-1",
    );
    expect(screen.getByRole("button", { name: /confirmar/i })).toBeInTheDocument();
  });

  it("trocar a foto atualiza o preview e revoga a URL anterior", () => {
    render(<FormularioMarcarItemComFoto itemId="i1" descricao="Ida à academia" />);

    const input = screen.getByLabelText("Foto", { selector: "input" });
    selecionarArquivo(input, "foto1.png");

    fireEvent.click(screen.getByRole("button", { name: /trocar foto/i }));
    selecionarArquivo(input, "foto2.png");

    expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:preview-1");
    expect(screen.getByAltText("Prévia da foto selecionada")).toHaveAttribute(
      "src",
      "blob:preview-2",
    );
  });

  it("confirmar chama marcarItemComFoto com um FormData contendo o arquivo escolhido", async () => {
    vi.mocked(marcarItemComFoto).mockResolvedValue(undefined);
    render(<FormularioMarcarItemComFoto itemId="i1" descricao="Ida à academia" />);

    const input = screen.getByLabelText("Foto", { selector: "input" });
    const arquivo = selecionarArquivo(input, "foto1.png");

    fireEvent.click(screen.getByRole("button", { name: /confirmar/i }));

    await waitFor(() => expect(marcarItemComFoto).toHaveBeenCalledTimes(1));
    const [itemIdChamado, formDataChamado] = vi.mocked(marcarItemComFoto).mock.calls[0]!;
    expect(itemIdChamado).toBe("i1");
    expect(formDataChamado.get("foto")).toBe(arquivo);
  });
});
