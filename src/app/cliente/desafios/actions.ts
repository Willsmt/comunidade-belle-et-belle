"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requererPapel } from "@/lib/auth/requerer-acesso-painel";
import { obterDataDeHoje } from "@/lib/hoje";
import { uploadComprovante } from "@/lib/storage/comprovantes-surpresa";

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

export async function participarDesafioSurpresa(
  desafioSurpresaId: string,
  formData: FormData,
) {
  const session = await requererPapel(["CLIENTE"]);
  const clienteId = session.user.id;

  const surpresa = await prisma.desafioSurpresa.findUniqueOrThrow({
    where: { id: desafioSurpresaId },
  });

  const jaParticipou = await prisma.participacaoSurpresa.findUnique({
    where: {
      desafioSurpresaId_clienteId: { desafioSurpresaId, clienteId },
    },
  });
  if (jaParticipou) {
    throw new Error("Você já participou desse desafio surpresa");
  }

  let fotoChave: string | null = null;
  if (surpresa.exigeComprovacao) {
    const arquivo = formData.get("comprovacao");
    if (!(arquivo instanceof File) || arquivo.size === 0) {
      throw new Error("Envie a foto de comprovação");
    }
    fotoChave = await uploadComprovante(arquivo, clienteId);
  }

  await prisma.participacaoSurpresa.create({
    data: { desafioSurpresaId, clienteId, fotoChave },
  });

  revalidatePath("/cliente/desafios");
}
