// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AvatarPessoa } from "./avatar-pessoa";

describe("AvatarPessoa", () => {
  it("mostra a foto quando fotoUrl está presente", () => {
    render(<AvatarPessoa nome="Maria Silva" fotoUrl="https://exemplo/foto.jpg" />);

    expect(screen.getByAltText("Foto de perfil de Maria Silva")).toHaveAttribute(
      "src",
      "https://exemplo/foto.jpg",
    );
    expect(screen.queryByText("MS")).not.toBeInTheDocument();
  });

  it("mostra as iniciais do nome quando não há fotoUrl", () => {
    render(<AvatarPessoa nome="Maria Silva" fotoUrl={null} />);

    expect(screen.getByText("MS")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("usa o tamanho pequeno por padrão e aceita tamanho grande", () => {
    const { rerender } = render(<AvatarPessoa nome="Maria" fotoUrl={null} />);
    expect(screen.getByText("M")).toHaveClass("size-6");

    rerender(<AvatarPessoa nome="Maria" fotoUrl={null} tamanho="lg" />);
    expect(screen.getByText("M")).toHaveClass("size-16");
  });
});
