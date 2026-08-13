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
};

export default nextConfig;
