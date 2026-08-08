"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requererAcessoPainel } from "@/lib/auth/requerer-acesso-painel";

export async function criarCategoria(desafioId: string, formData: FormData) {
  await requererAcessoPainel();

  const nome = formData.get("nome");
  const cor = formData.get("cor");

  if (typeof nome !== "string" || nome.trim() === "") {
    throw new Error("Informe o nome da categoria");
  }
  if (typeof cor !== "string" || cor.trim() === "") {
    throw new Error("Informe a cor da categoria");
  }

  await prisma.categoriaDesafio.create({
    data: { desafioId, nome, cor },
  });

  revalidatePath(`/painel/desafios/${desafioId}`);
}

export async function removerCategoria(categoriaId: string) {
  await requererAcessoPainel();

  const categoria = await prisma.categoriaDesafio.delete({
    where: { id: categoriaId },
  });

  revalidatePath(`/painel/desafios/${categoria.desafioId}`);
}

export async function criarItem(categoriaId: string, formData: FormData) {
  await requererAcessoPainel();

  const descricao = formData.get("descricao");
  const pontosRaw = formData.get("pontos");
  const frequencia = formData.get("frequencia");

  if (typeof descricao !== "string" || descricao.trim() === "") {
    throw new Error("Informe a descrição do item");
  }

  const pontos = typeof pontosRaw === "string" ? Number(pontosRaw) : NaN;
  if (!Number.isInteger(pontos) || pontos <= 0) {
    throw new Error("Informe uma pontuação válida");
  }

  if (frequencia !== "DIARIO" && frequencia !== "SEMANAL") {
    throw new Error("Informe uma frequência válida");
  }

  const categoria = await prisma.categoriaDesafio.findUniqueOrThrow({
    where: { id: categoriaId },
  });

  await prisma.itemDesafio.create({
    data: { categoriaId, descricao, pontos, frequencia },
  });

  revalidatePath(`/painel/desafios/${categoria.desafioId}`);
}

export async function removerItem(itemId: string) {
  await requererAcessoPainel();

  const item = await prisma.itemDesafio.delete({
    where: { id: itemId },
    include: { categoria: true },
  });

  revalidatePath(`/painel/desafios/${item.categoria.desafioId}`);
}
