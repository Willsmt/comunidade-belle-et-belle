export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Sob concorrência (ex.: o otimizador de imagens do next/image processando
  // uma foto ao mesmo tempo em que /cliente/desafios/poster usa sharp para
  // converter WebP), o libvips desta instalação corrompe seu estado nativo
  // global e todo sharp() seguinte no processo passa a falhar com "Input
  // buffer contains unsupported image format" — reproduzido isolando o bug
  // fora do next/og, mesmo sem nenhuma imagem de verdade envolvida. Só
  // reinicia o processo dev resolve depois que a corrupção já aconteceu.
  // concurrency(1) sozinho não bastou (corrupção voltou já na 1ª requisição
  // após restart); cache(false) evita reusar um resultado corrompido e
  // simd(false) evita um bug conhecido do Highway (SIMD) do libvips sob
  // WSL2/virtualização.
  const sharp = (await import("sharp")).default;
  sharp.concurrency(1);
  sharp.cache(false);
  sharp.simd(false);
}
