import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { obterR2Client, obterNomeBucket } from "./r2";
import { comprimirImagem } from "./comprimir-imagem";

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];
const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024;
const EXPIRACAO_URL_ASSINADA_SEGUNDOS = 300;

export function validarArquivo(arquivo: File): void {
  if (!TIPOS_PERMITIDOS.includes(arquivo.type)) {
    throw new Error(
      "Formato de imagem não suportado. Envie JPEG, PNG ou WebP.",
    );
  }
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    throw new Error("Imagem muito grande. Tamanho máximo: 5MB.");
  }
}

export async function uploadFoto(
  arquivo: File,
  clienteId: string,
): Promise<string> {
  validarArquivo(arquivo);

  const bufferOriginal = Buffer.from(await arquivo.arrayBuffer());
  const bufferComprimido = await comprimirImagem(bufferOriginal);

  const chave = `fotos-evolucao/${clienteId}/${randomUUID()}.webp`;

  await obterR2Client().send(
    new PutObjectCommand({
      Bucket: obterNomeBucket(),
      Key: chave,
      Body: bufferComprimido,
      ContentType: "image/webp",
    }),
  );

  return chave;
}

export async function gerarUrlAssinada(chave: string): Promise<string> {
  return getSignedUrl(
    obterR2Client(),
    new GetObjectCommand({ Bucket: obterNomeBucket(), Key: chave }),
    { expiresIn: EXPIRACAO_URL_ASSINADA_SEGUNDOS },
  );
}

export async function deletarFoto(chave: string): Promise<void> {
  await obterR2Client().send(
    new DeleteObjectCommand({ Bucket: obterNomeBucket(), Key: chave }),
  );
}
