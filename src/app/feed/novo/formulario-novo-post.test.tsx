// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FormularioNovoPost } from "./formulario-novo-post";
import { criarPost } from "../actions";

vi.mock("../actions", () => ({
  criarPost: vi.fn(),
}));

describe("FormularioNovoPost", () => {
  beforeEach(() => {
    vi.mocked(criarPost).mockReset();
  });

  it("chama criarPost com os dados do formulário ao publicar", async () => {
    vi.mocked(criarPost).mockResolvedValue(undefined);
    render(<FormularioNovoPost fotosEvolucao={[]} />);

    fireEvent.change(screen.getByLabelText(/texto/i), {
      target: { value: "meu progresso" },
    });
    fireEvent.click(screen.getByRole("button", { name: /publicar/i }));

    await waitFor(() => expect(criarPost).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("mostra a mensagem de erro e mantém o texto já digitado quando o post é inválido", async () => {
    vi.mocked(criarPost).mockRejectedValue(
      new Error("O post precisa de um texto ou uma imagem"),
    );
    render(<FormularioNovoPost fotosEvolucao={[]} />);

    const campoTexto = screen.getByLabelText(/texto/i) as HTMLTextAreaElement;
    fireEvent.change(campoTexto, { target: { value: "rascunho salvo" } });
    fireEvent.click(screen.getByRole("button", { name: /publicar/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "O post precisa de um texto ou uma imagem",
      ),
    );
    expect(campoTexto.value).toBe("rascunho salvo");
  });

  it("volta a habilitar o botão depois do erro", async () => {
    vi.mocked(criarPost).mockRejectedValue(new Error("Erro qualquer"));
    render(<FormularioNovoPost fotosEvolucao={[]} />);

    const botao = screen.getByRole("button", { name: /publicar/i });
    fireEvent.click(botao);

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(botao).not.toBeDisabled();
  });
});
