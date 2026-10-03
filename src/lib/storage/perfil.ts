import { randomUUID } from "node:crypto";
import { AppError } from "@/lib/actions/executar-action";
import {
  uploadObjeto,
  deletarObjeto,
  gerarUrlAssinada,
  gerarUrlAssinadaCacheavel,
} from "./objetos";
import { comprimirImagem } from "./comprimir-imagem";

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];
const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024;

export function validarArquivo(arquivo: File): void {
  if (!TIPOS_PERMITIDOS.includes(arquivo.type)) {
    throw new AppError(
      "Formato de imagem não suportado. Envie JPEG, PNG ou WebP.",
    );
  }
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    throw new AppError("Imagem muito grande. Tamanho máximo: 5MB.");
  }
}

export async function uploadFotoPerfil(
  arquivo: File,
  userId: string,
): Promise<string> {
  validarArquivo(arquivo);
  const bufferOriginal = Buffer.from(await arquivo.arrayBuffer());
  const bufferComprimido = await comprimirImagem(bufferOriginal);
  const chave = `perfis-cliente/${userId}/${randomUUID()}.webp`;
  await uploadObjeto(chave, bufferComprimido, "image/webp");
  return chave;
}

export { gerarUrlAssinada, gerarUrlAssinadaCacheavel };

export async function deletarFotoPerfil(chave: string): Promise<void> {
  await deletarObjeto(chave);
}
