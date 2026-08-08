import { S3Client } from "@aws-sdk/client-s3";

let clienteCache: S3Client | null = null;

function obterVariavelObrigatoria(nome: string): string {
  const valor = process.env[nome];
  if (!valor) {
    throw new Error(`Variável de ambiente ${nome} não configurada`);
  }
  return valor;
}

export function obterR2Client(): S3Client {
  if (!clienteCache) {
    const accountId = obterVariavelObrigatoria("R2_ACCOUNT_ID");
    const accessKeyId = obterVariavelObrigatoria("R2_ACCESS_KEY_ID");
    const secretAccessKey = obterVariavelObrigatoria("R2_SECRET_ACCESS_KEY");

    clienteCache = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return clienteCache;
}

export function obterNomeBucket(): string {
  return obterVariavelObrigatoria("R2_BUCKET_NAME");
}
