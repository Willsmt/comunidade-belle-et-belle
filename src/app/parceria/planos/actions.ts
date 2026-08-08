"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requererPapel } from "@/lib/auth/requerer-acesso-painel";
import { uploadPlano } from "@/lib/storage/planos";

const TIPOS_VALIDOS = ["TREINO", "DIETA"] as const;

export async function enviarPlano(formData: FormData) {
  const session = await requererPapel(["PARCERIA"]);

  const clienteId = formData.get("clienteId");
  const tipo = formData.get("tipo");
  const tituloValor = formData.get("titulo");
  const arquivo = formData.get("arquivo");

  if (typeof clienteId !== "string" || clienteId === "") {
    throw new Error("Selecione a cliente");
  }
  if (
    typeof tipo !== "string" ||
    !TIPOS_VALIDOS.includes(tipo as (typeof TIPOS_VALIDOS)[number])
  ) {
    throw new Error("Selecione o tipo do plano");
  }
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    throw new Error("Selecione um arquivo PDF");
  }

  const vinculo = await prisma.vinculoParceria.findUnique({
    where: {
      clienteId_parceriaId: { clienteId, parceriaId: session.user.id },
    },
  });
  if (!vinculo || !vinculo.ativo) {
    throw new Error("Cliente não vinculada a você");
  }

  const titulo =
    typeof tituloValor === "string" && tituloValor.trim() !== ""
      ? tituloValor.trim()
      : null;

  const arquivoChave = await uploadPlano(arquivo, clienteId);

  await prisma.planoRecebido.create({
    data: {
      clienteId,
      parceriaId: session.user.id,
      tipo: tipo as (typeof TIPOS_VALIDOS)[number],
      titulo,
      arquivoChave,
    },
  });

  revalidatePath("/parceria/planos");
}
