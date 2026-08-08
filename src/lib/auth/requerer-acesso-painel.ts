import { auth } from "@/auth";
import { podeAcessarPainel } from "./pode-acessar-painel";

export async function requererAcessoPainel() {
  const session = await auth();

  if (!session?.user || !podeAcessarPainel(session.user.papeis)) {
    throw new Error("Acesso negado");
  }

  return session;
}
