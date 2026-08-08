"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requererPapel } from "@/lib/auth/requerer-acesso-painel";
import { uploadFoto, deletarFoto } from "@/lib/storage/fotos";

export async function enviarFoto(formData: FormData) {
  const session = await requererPapel(["CLIENTE"]);

  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    throw new Error("Selecione uma imagem");
  }

  const chave = await uploadFoto(arquivo, session.user.id);

  await prisma.fotoEvolucao.create({
    data: { clienteId: session.user.id, chave },
  });

  revalidatePath("/cliente/fotos");
}

async function obterFotoDoUsuario(fotoId: string, clienteId: string) {
  const foto = await prisma.fotoEvolucao.findUnique({ where: { id: fotoId } });
  if (!foto || foto.clienteId !== clienteId) {
    throw new Error("Foto não encontrada");
  }
  return foto;
}

export async function alternarVisibilidadeFoto(formData: FormData) {
  const session = await requererPapel(["CLIENTE"]);

  const fotoId = formData.get("fotoId");
  if (typeof fotoId !== "string") {
    throw new Error("Foto inválida");
  }

  const foto = await obterFotoDoUsuario(fotoId, session.user.id);

  await prisma.fotoEvolucao.update({
    where: { id: fotoId },
    data: { publica: !foto.publica },
  });

  revalidatePath("/cliente/fotos");
  revalidatePath(`/perfil/${session.user.id}`);
}

export async function excluirFoto(formData: FormData) {
  const session = await requererPapel(["CLIENTE"]);

  const fotoId = formData.get("fotoId");
  if (typeof fotoId !== "string") {
    throw new Error("Foto inválida");
  }

  const foto = await obterFotoDoUsuario(fotoId, session.user.id);

  await deletarFoto(foto.chave);
  await prisma.fotoEvolucao.delete({ where: { id: fotoId } });

  revalidatePath("/cliente/fotos");
  revalidatePath(`/perfil/${session.user.id}`);
}
