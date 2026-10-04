import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import type { Papel } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { temAlgumPapel } from "./pode-acessar-painel";
import { AppError } from "@/lib/actions/executar-action";

const PAPEIS_COM_ACESSO_AO_PAINEL: readonly Papel[] = ["GESTORA", "ADMIN"];

// O middleware já barra conta PENDENTE/SUSPENSA, mas ele não é barreira de
// segurança: o gate do servidor confere o status por conta própria.
function contaAtiva(session: Session | null): session is Session {
  return session?.user?.status === "ATIVO";
}

export async function requererPapel(permitidos: Papel[]) {
  const session = await auth();
  if (!contaAtiva(session) || !temAlgumPapel(session.user.papeis ?? [], permitidos)) {
    throw new AppError("Acesso negado");
  }
  return session;
}

export function requererAcessoPainel() {
  return requererPapel([...PAPEIS_COM_ACESSO_AO_PAINEL]);
}

// Variante para leitura (queries e pages renderizadas no servidor): mesma
// regra de requererAcessoPainel, mas redireciona como o layout do painel em
// vez de lançar erro.
export async function requererAcessoPainelOuRedirecionar() {
  const session = await auth();
  if (
    !contaAtiva(session) ||
    !temAlgumPapel(session.user.papeis ?? [], [...PAPEIS_COM_ACESSO_AO_PAINEL])
  ) {
    redirect("/");
  }
  return session;
}

export async function requererSessao() {
  const session = await auth();
  if (!contaAtiva(session)) {
    throw new AppError("Acesso negado");
  }
  return session;
}
