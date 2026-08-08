import sharp from "sharp";

export async function comprimirImagem(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
}
