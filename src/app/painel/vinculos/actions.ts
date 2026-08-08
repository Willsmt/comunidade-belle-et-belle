"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requererAcessoPainel } from "@/lib/auth/requerer-acesso-painel";

export async function criarVinculo(formData: FormData) {
  const session = await requererAcessoPainel();

  const clienteId = formData.get("clienteId");
  const parceriaId = formData.get("parceriaId");

  if (typeof clienteId !== "string" || clienteId === "") {
    throw new Error("Selecione a cliente");
  }
  if (typeof parceriaId !== "string" || parceriaId === "") {
    throw new Error("Selecione a parceria");
  }

  await prisma.vinculoParceria.upsert({
    where: { clienteId_parceriaId: { clienteId, parceriaId } },
    create: {
      clienteId,
      parceriaId,
      criadoPorId: session.user.id,
      ativo: true,
    },
    update: { ativo: true },
  });

  revalidatePath("/painel/vinculos");
}

export async function desativarVinculo(vinculoId: string) {
  await requererAcessoPainel();

  await prisma.vinculoParceria.update({
    where: { id: vinculoId },
    data: { ativo: false },
  });

  revalidatePath("/painel/vinculos");
}

export async function reativarVinculo(vinculoId: string) {
  await requererAcessoPainel();

  await prisma.vinculoParceria.update({
    where: { id: vinculoId },
    data: { ativo: true },
  });

  revalidatePath("/painel/vinculos");
}
