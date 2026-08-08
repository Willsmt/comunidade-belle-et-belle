import type { Papel } from "@/generated/prisma/client";

const PAPEIS_COM_ACESSO_AO_PAINEL: readonly Papel[] = ["GESTORA", "ADMIN"];

export function podeAcessarPainel(papeis: Papel[]): boolean {
  return papeis.some((papel) => PAPEIS_COM_ACESSO_AO_PAINEL.includes(papel));
}
