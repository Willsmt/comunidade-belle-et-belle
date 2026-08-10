"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requererPapel } from "@/lib/auth/requerer-acesso-painel";
import { uploadFotoPerfil, deletarFotoPerfil } from "@/lib/storage/perfil";

function parseBooleano(formData: FormData, campo: string): boolean {
  return formData.get(campo) === "on";
}

function parseTexto(formData: FormData, campo: string): string | null {
  const valor = formData.get(campo);
  return typeof valor === "string" && valor.trim() !== "" ? valor.trim() : null;
}

export async function atualizarPerfil(formData: FormData) {
  const session = await requererPapel(["CLIENTE"]);

  const bio = parseTexto(formData, "bio");
  const nome = parseTexto(formData, "nome");

  const bioPublica = parseBooleano(formData, "bioPublica");
  const emblemasPublicos = parseBooleano(formData, "emblemasPublicos");
  const medidasPublicas = parseBooleano(formData, "medidasPublicas");

  const arquivo = formData.get("foto");
  let novaChave: string | undefined;

  if (arquivo instanceof File && arquivo.size > 0) {
    novaChave = await uploadFotoPerfil(arquivo, session.user.id);
  }

  const perfilAtual = await prisma.perfil.findUnique({
    where: { userId: session.user.id },
  });

  if (novaChave && perfilAtual?.fotoChave) {
    await deletarFotoPerfil(perfilAtual.fotoChave);
  }

  await prisma.perfil.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      bio,
      bioPublica,
      emblemasPublicos,
      medidasPublicas,
      fotoChave: novaChave ?? null,
    },
    update: {
      bio,
      bioPublica,
      emblemasPublicos,
      medidasPublicas,
      ...(novaChave ? { fotoChave: novaChave } : {}),
    },
  });

  if (nome) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: nome },
    });
  }

  revalidatePath("/cliente/perfil");
  revalidatePath(`/perfil/${session.user.id}`);
}
