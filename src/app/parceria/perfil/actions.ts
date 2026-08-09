"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requererPapel } from "@/lib/auth/requerer-acesso-painel";
import {
  uploadFotoParceria,
  deletarFotoParceria,
} from "@/lib/storage/parcerias";

function parseTexto(formData: FormData, campo: string): string | null {
  const valor = formData.get(campo);
  return typeof valor === "string" && valor.trim() !== "" ? valor.trim() : null;
}

export async function atualizarPerfilParceria(formData: FormData) {
  const session = await requererPapel(["PARCERIA"]);

  const especialidade = parseTexto(formData, "especialidade");
  const bio = parseTexto(formData, "bio");

  const arquivo = formData.get("foto");
  let novaChave: string | undefined;

  if (arquivo instanceof File && arquivo.size > 0) {
    novaChave = await uploadFotoParceria(arquivo, session.user.id);
  }

  const perfilAtual = await prisma.perfilParceria.findUnique({
    where: { usuarioId: session.user.id },
  });

  if (novaChave && perfilAtual?.fotoChave) {
    await deletarFotoParceria(perfilAtual.fotoChave);
  }

  await prisma.perfilParceria.upsert({
    where: { usuarioId: session.user.id },
    create: {
      usuarioId: session.user.id,
      especialidade,
      bio,
      fotoChave: novaChave ?? null,
    },
    update: {
      especialidade,
      bio,
      ...(novaChave ? { fotoChave: novaChave } : {}),
    },
  });

  revalidatePath("/parceria/perfil");
}
