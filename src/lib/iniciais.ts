export function obterIniciais(nome: string | null | undefined): string {
  const partes = (nome ?? "").trim().split(/\s+/).filter(Boolean);

  if (partes.length === 0) {
    return "";
  }

  if (partes.length === 1) {
    return partes[0]!.charAt(0).toUpperCase();
  }

  const primeira = partes[0]!.charAt(0);
  const ultima = partes[partes.length - 1]!.charAt(0);

  return `${primeira}${ultima}`.toUpperCase();
}
