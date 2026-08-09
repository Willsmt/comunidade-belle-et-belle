"use server";

import { revalidatePath } from "next/cache";
import type { Papel } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requererAcessoPainel } from "@/lib/auth/requerer-acesso-painel";
import { temAlgumPapel } from "@/lib/auth/pode-acessar-painel";

const PAPEIS_COM_ACESSO_AO_PAINEL: readonly Papel[] = ["ADMIN", "GESTORA"];

function garantirEhAdmin(papeis: Papel[]) {
  if (!temAlgumPapel(papeis, ["ADMIN"])) {
    throw new Error("Só uma conta ADMIN pode gerenciar o papel de Gestora.");
  }
}

async function garantirNaoUltimoAdminOuGestoraAtivo(
  userId: string,
  mensagemErro: string,
) {
  const outrosAtivos = await prisma.user.count({
    where: {
      id: { not: userId },
      status: "ATIVO",
      papeis: { some: { papel: { in: [...PAPEIS_COM_ACESSO_AO_PAINEL] } } },
    },
  });

  if (outrosAtivos === 0) {
    throw new Error(mensagemErro);
  }
}

export async function suspenderMembro(userId: string) {
  const session = await requererAcessoPainel();

  if (session.user.id === userId) {
    throw new Error("Você não pode suspender a própria conta.");
  }

  await garantirNaoUltimoAdminOuGestoraAtivo(
    userId,
    "Não é possível suspender: não sobraria nenhuma conta ADMIN ou GESTORA ativa.",
  );

  await prisma.user.update({
    where: { id: userId },
    data: { status: "SUSPENSO" },
  });

  revalidatePath("/painel/membros");
}

export async function reativarMembro(userId: string) {
  await requererAcessoPainel();

  await prisma.user.update({
    where: { id: userId },
    data: { status: "ATIVO" },
  });

  revalidatePath("/painel/membros");
}

export async function deletarMembro(userId: string) {
  const session = await requererAcessoPainel();

  if (session.user.id === userId) {
    throw new Error("Você não pode deletar a própria conta.");
  }

  await garantirNaoUltimoAdminOuGestoraAtivo(
    userId,
    "Não é possível deletar: não sobraria nenhuma conta ADMIN ou GESTORA ativa.",
  );

  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/painel/membros");
}

export async function promoverAParceria(userId: string) {
  await requererAcessoPainel();

  await prisma.usuarioPapel.upsert({
    where: { userId_papel: { userId, papel: "PARCERIA" } },
    create: { userId, papel: "PARCERIA" },
    update: {},
  });

  revalidatePath("/painel/membros");
}

export async function revogarParceria(userId: string) {
  await requererAcessoPainel();

  await prisma.$transaction([
    prisma.usuarioPapel.deleteMany({
      where: { userId, papel: "PARCERIA" },
    }),
    prisma.vinculoParceria.updateMany({
      where: { parceriaId: userId, ativo: true },
      data: { ativo: false },
    }),
  ]);

  revalidatePath("/painel/membros");
  revalidatePath("/painel/vinculos");
  revalidatePath("/cliente/parcerias");
}

export async function promoverAGestora(userId: string) {
  const session = await requererAcessoPainel();
  garantirEhAdmin(session.user.papeis);

  await prisma.usuarioPapel.upsert({
    where: { userId_papel: { userId, papel: "GESTORA" } },
    create: { userId, papel: "GESTORA" },
    update: {},
  });

  revalidatePath("/painel/membros");
}

export async function revogarGestora(userId: string) {
  const session = await requererAcessoPainel();
  garantirEhAdmin(session.user.papeis);

  await garantirNaoUltimoAdminOuGestoraAtivo(
    userId,
    "Não é possível revogar: não sobraria nenhuma conta ADMIN ou GESTORA ativa.",
  );

  await prisma.usuarioPapel.deleteMany({
    where: { userId, papel: "GESTORA" },
  });

  revalidatePath("/painel/membros");
}
