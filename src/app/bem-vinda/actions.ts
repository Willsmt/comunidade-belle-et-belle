"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { VERSAO_TERMO_ATUAL } from "@/lib/consentimento/versao-termo";

export async function aceitarTermo() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Sessão inválida");
  }

  await prisma.consentimento.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, versaoTermo: VERSAO_TERMO_ATUAL },
    update: { versaoTermo: VERSAO_TERMO_ATUAL, aceitoEm: new Date() },
  });

  return { ok: true as const };
}
