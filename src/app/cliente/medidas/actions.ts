"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requererPapel } from "@/lib/auth/requerer-acesso-painel";

const CAMPOS_MEDIDA = ["peso", "cintura", "quadril", "braco", "coxa"] as const;

function parseNumero(formData: FormData, campo: string): number | undefined {
  const valor = formData.get(campo);
  if (typeof valor !== "string" || valor.trim() === "") {
    return undefined;
  }
  return Number(valor);
}

function parseData(formData: FormData): Date | undefined {
  const valor = formData.get("data");
  if (typeof valor !== "string" || valor.trim() === "") {
    return undefined;
  }
  return new Date(valor);
}

export async function criarRegistroMedida(formData: FormData) {
  const session = await requererPapel(["CLIENTE"]);

  const medidas = Object.fromEntries(
    CAMPOS_MEDIDA.map((campo) => [campo, parseNumero(formData, campo)]),
  ) as Record<(typeof CAMPOS_MEDIDA)[number], number | undefined>;

  if (CAMPOS_MEDIDA.every((campo) => medidas[campo] === undefined)) {
    throw new Error("Preencha ao menos uma medida");
  }

  await prisma.registroMedida.create({
    data: {
      clienteId: session.user.id,
      data: parseData(formData),
      ...medidas,
    },
  });

  revalidatePath("/cliente/medidas");
}
