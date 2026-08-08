"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requererPapel } from "@/lib/auth/requerer-acesso-painel";
import { obterDataDeHoje } from "@/lib/hoje";

export async function alternarMarcacao(itemId: string) {
  const session = await requererPapel(["CLIENTE"]);

  await prisma.itemDesafio.findUniqueOrThrow({ where: { id: itemId } });

  const hoje = obterDataDeHoje();
  const clienteId = session.user.id;

  const existente = await prisma.marcacaoItem.findUnique({
    where: { itemId_clienteId_data: { itemId, clienteId, data: hoje } },
  });

  if (existente) {
    await prisma.marcacaoItem.delete({ where: { id: existente.id } });
  } else {
    await prisma.marcacaoItem.create({
      data: { itemId, clienteId, data: hoje },
    });
  }

  revalidatePath("/cliente/desafios");
}
