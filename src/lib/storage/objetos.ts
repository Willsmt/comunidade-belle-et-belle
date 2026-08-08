import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { obterR2Client, obterNomeBucket } from "./r2";

const EXPIRACAO_URL_ASSINADA_SEGUNDOS = 300;

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

export async function deletarObjeto(chave: string): Promise<void> {
  await obterR2Client().send(
    new DeleteObjectCommand({ Bucket: obterNomeBucket(), Key: chave }),
  );
}
