import { randomUUID } from "node:crypto";
import { uploadObjeto, gerarUrlAssinada, deletarObjeto } from "./objetos";

const TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024;

export function validarArquivoPdf(arquivo: File): void {
  if (arquivo.type !== "application/pdf") {
    throw new Error("Formato inválido. Envie um arquivo PDF.");
  }
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    throw new Error("Arquivo muito grande. Tamanho máximo: 10MB.");
  }
}

export async function uploadPlano(
  arquivo: File,
  clienteId: string,
): Promise<string> {
  validarArquivoPdf(arquivo);

  const buffer = Buffer.from(await arquivo.arrayBuffer());
  const chave = `planos/${clienteId}/${randomUUID()}.pdf`;

  await uploadObjeto(chave, buffer, "application/pdf");

  return chave;
}

export { gerarUrlAssinada };

export async function deletarPlano(chave: string): Promise<void> {
  await deletarObjeto(chave);
}
