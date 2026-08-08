"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requererPapel } from "@/lib/auth/requerer-acesso-painel";

function parseBooleano(formData: FormData, campo: string): boolean {
  return formData.get(campo) === "on";
}

export async function atualizarPerfil(formData: FormData) {
  const session = await requererPapel(["CLIENTE"]);

  const bioValor = formData.get("bio");
  const bio =
    typeof bioValor === "string" && bioValor.trim() !== ""
      ? bioValor.trim()
      : null;

  const bioPublica = parseBooleano(formData, "bioPublica");
  const emblemasPublicos = parseBooleano(formData, "emblemasPublicos");
  const medidasPublicas = parseBooleano(formData, "medidasPublicas");

  await prisma.perfil.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      bio,
      bioPublica,
      emblemasPublicos,
      medidasPublicas,
    },
    update: {
      bio,
      bioPublica,
      emblemasPublicos,
      medidasPublicas,
    },
  });

  revalidatePath("/cliente/perfil");
  revalidatePath(`/perfil/${session.user.id}`);
}
