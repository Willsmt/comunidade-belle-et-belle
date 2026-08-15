import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { comprimirImagem } from "./comprimir-imagem";

async function criarImagemValida(formato: "png" | "jpeg" | "webp"): Promise<Buffer> {
  const base = sharp({
    create: {
      width: 10,
      height: 10,
      channels: 3,
      background: { r: 200, g: 30, b: 90 },
    },
  });
  if (formato === "png") return base.png().toBuffer();
  if (formato === "jpeg") return base.jpeg().toBuffer();
  return base.webp().toBuffer();
}

describe("comprimirImagem", () => {
  it("comprime um PNG válido pra WebP", async () => {
    const resultado = await comprimirImagem(await criarImagemValida("png"));
    const metadata = await sharp(resultado).metadata();
    expect(metadata.format).toBe("webp");
  });

  it("comprime um JPEG válido pra WebP", async () => {
    const resultado = await comprimirImagem(await criarImagemValida("jpeg"));
    const metadata = await sharp(resultado).metadata();
    expect(metadata.format).toBe("webp");
  });

  it("comprime um WebP válido pra WebP", async () => {
    const resultado = await comprimirImagem(await criarImagemValida("webp"));
    const metadata = await sharp(resultado).metadata();
    expect(metadata.format).toBe("webp");
  });

  it("rejeita um arquivo que não é imagem de verdade, mesmo que o Content-Type declarado minta", async () => {
    const buffer = Buffer.from("isso aqui não é uma imagem, é só texto puro");
    await expect(comprimirImagem(buffer)).rejects.toThrow(
      "Não foi possível ler essa imagem",
    );
  });
});
