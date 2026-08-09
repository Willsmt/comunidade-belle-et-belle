import type { StatusConta } from "@/generated/prisma/client";

type SessaoUsuario = {
  status: StatusConta;
  temConsentimento: boolean;
} | null;

export function deveMostrarNavegacaoPrincipal(usuario: SessaoUsuario): boolean {
  return !!usuario && usuario.status === "ATIVO" && usuario.temConsentimento;
}
