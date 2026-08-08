"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requererAcessoPainel } from "@/lib/auth/requerer-acesso-painel";

export async function aprovarConta(userId: string) {
  const session = await requererAcessoPainel();

  await prisma.user.update({
    where: { id: userId },
    data: {
      status: "ATIVO",
      aprovadoPor: session.user.id,
      aprovadoEm: new Date(),
    },
  });

  revalidatePath("/painel/aprovacoes");
}

export async function rejeitarConta(userId: string) {
  await requererAcessoPainel();

  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/painel/aprovacoes");
}
