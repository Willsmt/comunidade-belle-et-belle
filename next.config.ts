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
    // Em dev (WSL2), o otimizador embutido do next/image chama sharp() pra
    // redimensionar essas fotos, e isso corrompe o estado nativo do libvips
    // compartilhado com o sharp que /cliente/desafios/poster usa via next/og
    // — ver src/instrumentation.ts. concurrency(1)/cache(false)/simd(false)
    // não bastaram para eliminar a corrupção, então evitamos o gatilho
    // desligando a otimização só em dev; produção continua otimizando.
    unoptimized: process.env.NODE_ENV !== "production",
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
