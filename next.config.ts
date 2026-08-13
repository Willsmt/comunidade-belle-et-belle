import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Maior upload validado hoje é o PDF de plano (10MB, ver
      // TAMANHO_MAXIMO_BYTES em src/lib/storage/planos.ts). O limite aqui é
      // sobre o corpo bruto multipart/form-data (arquivo + boundaries/
      // headers), então precisa de folga acima desse valor.
      bodySizeLimit: "12mb",
    },
  },
  images: {
    remotePatterns: [
      {
        // getSignedUrl (src/lib/storage/objetos.ts) gera URL virtual-hosted-
        // style do S3 SDK: https://<bucket>.<accountId>.r2.cloudflarestorage.com/...
        // (confirmado gerando uma URL assinada real, não é o endpoint sem o
        // bucket que aparece em obterR2Client).
        protocol: "https",
        hostname: `${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
