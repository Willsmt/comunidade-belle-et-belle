"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requererAcessoPainel } from "@/lib/auth/requerer-acesso-painel";
import { AppError, executarAction } from "@/lib/actions/executar-action";

export async function criarVinculo(formData: FormData) {
  return executarAction(async () => {
    const session = await requererAcessoPainel();

    const clienteId = formData.get("clienteId");
    const parceriaId = formData.get("parceriaId");

    if (typeof clienteId !== "string" || clienteId === "") {
      throw new AppError("Selecione a cliente");
    }
    if (typeof parceriaId !== "string" || parceriaId === "") {
      throw new AppError("Selecione a parceria");
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
  });
}

export async function desativarVinculo(vinculoId: string) {
  return executarAction(async () => {
    await requererAcessoPainel();

    await prisma.vinculoParceria.update({
      where: { id: vinculoId },
      data: { ativo: false },
    });

    revalidatePath("/painel/vinculos");
  });
}

export async function reativarVinculo(vinculoId: string) {
  return executarAction(async () => {
    await requererAcessoPainel();

    await prisma.vinculoParceria.update({
      where: { id: vinculoId },
      data: { ativo: true },
    });

    revalidatePath("/painel/vinculos");
  });
}
