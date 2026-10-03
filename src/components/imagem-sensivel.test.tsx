// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ImagemSensivel } from "./imagem-sensivel";

const URL_ORIGINAL = "https://bucket.conta.r2.cloudflarestorage.com/foto.webp?X-Amz-Signature=abc";

describe("ImagemSensivel", () => {
  it("aponta direto para a URL original, sem passar pelo otimizador", () => {
    render(<ImagemSensivel src={URL_ORIGINAL} alt="Foto" width={80} height={80} />);

    expect(screen.getByAltText("Foto")).toHaveAttribute("src", URL_ORIGINAL);
  });

  it("ignora unoptimized={false} vindo de quem chama", () => {
    render(
      <ImagemSensivel
        src={URL_ORIGINAL}
        alt="Foto"
        width={80}
        height={80}
        unoptimized={false}
      />,
    );

    const src = screen.getByAltText("Foto").getAttribute("src");
    expect(src).toBe(URL_ORIGINAL);
    expect(src).not.toContain("/_next/image");
  });
});
