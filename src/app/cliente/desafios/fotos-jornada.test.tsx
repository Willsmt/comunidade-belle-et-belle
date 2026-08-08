// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FotosJornada } from "./fotos-jornada";

vi.mock("./actions", () => ({
  enviarFotoAntes: vi.fn(),
  enviarFotoDepois: vi.fn(),
}));

describe("FotosJornada", () => {
  it("mostra mensagem de vazio e botão 'Enviar foto' quando não há fotos", () => {
    render(<FotosJornada fotoAntesUrl={null} fotoDepoisUrl={null} />);

    expect(screen.getAllByText(/nenhuma foto enviada ainda/i)).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /^enviar foto$/i })).toHaveLength(2);
  });

  it("mostra as fotos e botão 'Trocar foto' quando já enviadas", () => {
    render(
      <FotosJornada
        fotoAntesUrl="https://exemplo/antes.webp"
        fotoDepoisUrl="https://exemplo/depois.webp"
      />,
    );

    expect(screen.getByAltText("Foto de antes")).toBeInTheDocument();
    expect(screen.getByAltText("Foto de depois")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /trocar foto/i })).toHaveLength(2);
  });
});
