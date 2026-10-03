import { AppError } from "@/lib/actions/executar-action";
import { randomUUID } from "node:crypto";
import { uploadObjeto, gerarUrlAssinada, deletarObjeto } from "./objetos";

const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024;
const ASSINATURA_PDF = "%PDF-";

export function validarArquivoPdf(arquivo: File): void {
  if (arquivo.type !== "application/pdf") {
    throw new AppError("Formato inválido. Envie um arquivo PDF.");
  }
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    throw new AppError("Arquivo muito grande. Tamanho máximo: 5MB.");
  }
}

export async function uploadPlano(
  arquivo: File,
  clienteId: string,
): Promise<string> {
  validarArquivoPdf(arquivo);

  const buffer = Buffer.from(await arquivo.arrayBuffer());
  // arquivo.type é declaração do client; a assinatura binária é a checagem real.
  if (buffer.subarray(0, ASSINATURA_PDF.length).toString("latin1") !== ASSINATURA_PDF) {
    throw new AppError("Arquivo não é um PDF válido.");
  }
  const chave = `planos/${clienteId}/${randomUUID()}.pdf`;

  await uploadObjeto(chave, buffer, "application/pdf");

  return chave;
}

export { gerarUrlAssinada };

export async function deletarPlano(chave: string): Promise<void> {
  await deletarObjeto(chave);
}
