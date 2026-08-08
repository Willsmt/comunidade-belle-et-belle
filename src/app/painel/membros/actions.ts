"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requererAcessoPainel } from "@/lib/auth/requerer-acesso-painel";

export async function suspenderMembro(userId: string) {
  await requererAcessoPainel();

  await prisma.user.update({
    where: { id: userId },
    data: { status: "SUSPENSO" },
  });

  revalidatePath("/painel/membros");
}

export async function reativarMembro(userId: string) {
  await requererAcessoPainel();

  await prisma.user.update({
    where: { id: userId },
    data: { status: "ATIVO" },
  });

  revalidatePath("/painel/membros");
}

export async function deletarMembro(userId: string) {
  await requererAcessoPainel();

  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/painel/membros");
}
