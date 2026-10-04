export const NOME_FALLBACK_MEMBRA = "Membra da comunidade";

// Nome mostrado para OUTRA usuária: nunca cai para o e-mail.
export function nomeParaExibicao(nome: string | null | undefined): string {
  return nome?.trim() ? nome : NOME_FALLBACK_MEMBRA;
}
