import type { Papel } from "@/generated/prisma/client";

export function temAlgumPapel(papeis: Papel[], permitidos: Papel[]): boolean {
  return papeis.some((papel) => permitidos.includes(papel));
}

const PAPEIS_COM_ACESSO_AO_PAINEL: readonly Papel[] = ["GESTORA", "ADMIN"];
const PAPEIS_COM_ACESSO_A_AREA_CLIENTE: readonly Papel[] = ["CLIENTE"];
const PAPEIS_COM_ACESSO_A_AREA_PARCERIA: readonly Papel[] = ["PARCERIA"];

export function podeAcessarPainel(papeis: Papel[]): boolean {
  return temAlgumPapel(papeis, [...PAPEIS_COM_ACESSO_AO_PAINEL]);
}

export function podeAcessarAreaCliente(papeis: Papel[]): boolean {
  return temAlgumPapel(papeis, [...PAPEIS_COM_ACESSO_A_AREA_CLIENTE]);
}

export function podeAcessarAreaParceria(papeis: Papel[]): boolean {
  return temAlgumPapel(papeis, [...PAPEIS_COM_ACESSO_A_AREA_PARCERIA]);
}

export function podeAcessarDesafiosCliente(papeis: Papel[]): boolean {
  return podeAcessarAreaCliente(papeis) || podeAcessarPainel(papeis);
}
