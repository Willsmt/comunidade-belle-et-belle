import sharp from "sharp";

// Limite explícito de pixels de entrada — mesmo valor padrão do sharp/libvips
// (268402689 ≈ 16383×16383), mas declarado aqui pra não depender de um
// default que pode mudar silenciosamente numa versão futura da lib. Protege
// contra "decompression bombs": imagem pequena em bytes que declara
// dimensões gigantescas e estoura memória/CPU ao decodificar.
const LIMITE_PIXELS_ENTRADA = 268402689;

// A checagem por Content-Type em validarArquivo() (fotos.ts) é só uma
// declaração do client — spoofável. A fronteira de segurança real é aqui:
// o sharp lê a assinatura binária de verdade pra determinar o formato,
// então isso não depende do que o client afirmou que estava enviando.
const FORMATOS_PERMITIDOS = new Set(["jpeg", "png", "webp"]);

async function validarFormatoReal(buffer: Buffer): Promise<void> {
  let formato: string | undefined;
  try {
    ({ format: formato } = await sharp(buffer, {
      limitInputPixels: LIMITE_PIXELS_ENTRADA,
    }).metadata());
  } catch {
    throw new Error(
      "Não foi possível ler essa imagem. Verifique o arquivo e tente novamente.",
    );
  }
  if (!formato || !FORMATOS_PERMITIDOS.has(formato)) {
    throw new Error(
      "Formato de imagem não suportado. Envie JPEG, PNG ou WebP.",
    );
  }
}

export async function comprimirImagem(buffer: Buffer): Promise<Buffer> {
  await validarFormatoReal(buffer);
  try {
    return await sharp(buffer, { limitInputPixels: LIMITE_PIXELS_ENTRADA })
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    throw new Error(
      "Não foi possível processar essa imagem. Verifique o arquivo e tente novamente.",
    );
  }
}
