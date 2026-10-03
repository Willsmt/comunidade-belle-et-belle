import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { obterR2Client, obterNomeBucket } from "./r2";

const EXPIRACAO_URL_ASSINADA_SEGUNDOS = 300;
const JANELA_URL_CACHEAVEL_MS = 60 * 60 * 1000;
const EXPIRACAO_URL_CACHEAVEL_SEGUNDOS = 2 * 60 * 60;

export async function uploadObjeto(
  chave: string,
  corpo: Buffer,
  contentType: string,
): Promise<void> {
  await obterR2Client().send(
    new PutObjectCommand({
      Bucket: obterNomeBucket(),
      Key: chave,
      Body: corpo,
      ContentType: contentType,
    }),
  );
}

export async function gerarUrlAssinada(chave: string): Promise<string> {
  return getSignedUrl(
    obterR2Client(),
    new GetObjectCommand({ Bucket: obterNomeBucket(), Key: chave }),
    { expiresIn: EXPIRACAO_URL_ASSINADA_SEGUNDOS },
  );
}

export async function gerarUrlAssinadaCacheavel(
  chave: string,
  agora: Date = new Date(),
): Promise<string> {
  const signingDate = new Date(
    Math.floor(agora.getTime() / JANELA_URL_CACHEAVEL_MS) *
      JANELA_URL_CACHEAVEL_MS,
  );
  return getSignedUrl(
    obterR2Client(),
    new GetObjectCommand({ Bucket: obterNomeBucket(), Key: chave }),
    { expiresIn: EXPIRACAO_URL_CACHEAVEL_SEGUNDOS, signingDate },
  );
}

export async function deletarObjeto(chave: string): Promise<void> {
  await obterR2Client().send(
    new DeleteObjectCommand({ Bucket: obterNomeBucket(), Key: chave }),
  );
}

// O banco é a fonte da verdade: depois que o registro foi atualizado, falhar
// ao limpar o R2 deixa só um objeto órfão (logado) em vez de quebrar a ação.
export async function apagarObjetoEmMelhorEsforco(
  chave: string,
  contexto: string,
): Promise<void> {
  try {
    await deletarObjeto(chave);
  } catch (erro) {
    console.error(
      `Falha ao apagar objeto no R2 (${contexto}):`,
      chave,
      erro,
    );
  }
}
