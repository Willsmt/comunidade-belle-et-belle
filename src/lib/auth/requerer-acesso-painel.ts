import type { Papel } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { temAlgumPapel } from "./pode-acessar-painel";

const PAPEIS_COM_ACESSO_AO_PAINEL: readonly Papel[] = ["GESTORA", "ADMIN"];

export async function requererPapel(permitidos: Papel[]) {
  const session = await auth();

  if (!session?.user || !temAlgumPapel(session.user.papeis, permitidos)) {
    throw new Error("Acesso negado");
  }

  return session;
}

export function requererAcessoPainel() {
  return requererPapel([...PAPEIS_COM_ACESSO_AO_PAINEL]);
}

export async function requererSessao() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Acesso negado");
  }

  return session;
}
