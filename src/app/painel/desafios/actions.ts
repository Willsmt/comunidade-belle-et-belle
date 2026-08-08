"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requererAcessoPainel } from "@/lib/auth/requerer-acesso-painel";

export async function criarDesafio(formData: FormData) {
  await requererAcessoPainel();

  const titulo = formData.get("titulo");
  const fraseMotivacional = formData.get("fraseMotivacional");
  const dataInicio = formData.get("dataInicio");
  const dataFim = formData.get("dataFim");

  if (typeof titulo !== "string" || titulo.trim() === "") {
    throw new Error("Informe o título do desafio");
  }
  if (typeof dataInicio !== "string" || dataInicio === "") {
    throw new Error("Informe a data de início");
  }
  if (typeof dataFim !== "string" || dataFim === "") {
    throw new Error("Informe a data de fim");
  }

  const desafioAtivo = await prisma.desafio.findFirst({ where: { ativo: true } });
  if (desafioAtivo) {
    throw new Error(
      `Já existe um desafio ativo (${desafioAtivo.titulo}). Encerre-o antes de criar um novo.`,
    );
  }

  await prisma.desafio.create({
    data: {
      titulo,
      fraseMotivacional:
        typeof fraseMotivacional === "string" && fraseMotivacional.trim() !== ""
          ? fraseMotivacional
          : null,
      dataInicio: new Date(dataInicio),
      dataFim: new Date(dataFim),
      ativo: true,
    },
  });

  revalidatePath("/painel/desafios");
}

export async function encerrarDesafio(desafioId: string) {
  await requererAcessoPainel();

  await prisma.desafio.update({
    where: { id: desafioId },
    data: { ativo: false },
  });

  revalidatePath("/painel/desafios");
}

export async function reabrirDesafio(desafioId: string) {
  await requererAcessoPainel();

  const desafioAtivo = await prisma.desafio.findFirst({ where: { ativo: true } });
  if (desafioAtivo && desafioAtivo.id !== desafioId) {
    throw new Error(
      `Já existe um desafio ativo (${desafioAtivo.titulo}). Encerre-o antes de reabrir outro.`,
    );
  }

  await prisma.desafio.update({
    where: { id: desafioId },
    data: { ativo: true },
  });

  revalidatePath("/painel/desafios");
}
