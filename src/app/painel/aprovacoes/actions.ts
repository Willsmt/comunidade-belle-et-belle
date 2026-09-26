"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requererAcessoPainel } from "@/lib/auth/requerer-acesso-painel";
import { executarAction } from "@/lib/actions/executar-action";

export async function aprovarConta(userId: string) {
  return executarAction(async () => {
    const session = await requererAcessoPainel();

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          status: "ATIVO",
          aprovadoPor: session.user.id,
          aprovadoEm: new Date(),
        },
      }),
      prisma.usuarioPapel.upsert({
        where: { userId_papel: { userId, papel: "CLIENTE" } },
        create: { userId, papel: "CLIENTE" },
        update: {},
      }),
    ]);

    revalidatePath("/painel/aprovacoes");
  });
}

export async function rejeitarConta(userId: string) {
  return executarAction(async () => {
    await requererAcessoPainel();

    await prisma.user.delete({ where: { id: userId } });

    revalidatePath("/painel/aprovacoes");
  });
}
