import type { Session } from "next-auth";
import type { Papel, StatusConta } from "@/generated/prisma/client";

type UsuarioParaSessao = {
  status: StatusConta;
  papeis: { papel: Papel }[];
  consentimento: { id: string } | null;
} | null;

export function enrichSession(
  session: Session,
  userId: string,
  dbUser: UsuarioParaSessao,
): Session {
  if (!dbUser) {
    return session;
  }

  session.user.id = userId;
  session.user.status = dbUser.status;
  session.user.papeis = dbUser.papeis.map((p) => p.papel);
  session.user.temConsentimento = dbUser.consentimento !== null;

  return session;
}
