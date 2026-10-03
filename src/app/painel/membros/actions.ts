"use server";

import { revalidatePath } from "next/cache";
import type { Papel } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requererAcessoPainel } from "@/lib/auth/requerer-acesso-painel";
import { temAlgumPapel } from "@/lib/auth/pode-acessar-painel";
import { apagarObjetoEmMelhorEsforco } from "@/lib/storage/objetos";
import { AppError, executarAction } from "@/lib/actions/executar-action";

const PAPEIS_COM_ACESSO_AO_PAINEL: readonly Papel[] = ["ADMIN", "GESTORA"];

function garantirEhAdmin(papeis: Papel[]) {
  if (!temAlgumPapel(papeis, ["ADMIN"])) {
    throw new AppError("Só uma conta ADMIN pode gerenciar o papel de Gestora.");
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
    throw new AppError(mensagemErro);
  }
}

export async function suspenderMembro(userId: string) {
  return executarAction(async () => {
    const session = await requererAcessoPainel();

    if (session.user.id === userId) {
      throw new AppError("Você não pode suspender a própria conta.");
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
  });
}

export async function reativarMembro(userId: string) {
  return executarAction(async () => {
    await requererAcessoPainel();

    await prisma.user.update({
      where: { id: userId },
      data: { status: "ATIVO" },
    });

    revalidatePath("/painel/membros");
  });
}

async function listarChavesDoUsuario(userId: string): Promise<string[]> {
  const [
    perfil,
    perfilParceria,
    fotos,
    jornadas,
    participacoes,
    marcacoes,
    posts,
    planos,
  ] = await Promise.all([
    prisma.perfil.findUnique({ where: { userId } }),
    prisma.perfilParceria.findUnique({ where: { usuarioId: userId } }),
    prisma.fotoEvolucao.findMany({ where: { clienteId: userId } }),
    prisma.jornadaDesafio.findMany({ where: { clienteId: userId } }),
    prisma.participacaoSurpresa.findMany({ where: { clienteId: userId } }),
    prisma.marcacaoItem.findMany({
      where: { clienteId: userId, fotoChave: { not: null } },
    }),
    prisma.post.findMany({ where: { autorId: userId } }),
    prisma.planoRecebido.findMany({
      where: { OR: [{ clienteId: userId }, { parceriaId: userId }] },
    }),
  ]);

  const chaves = new Set<string>();

  if (perfil?.fotoChave) {
    chaves.add(perfil.fotoChave);
  }
  if (perfilParceria?.fotoChave) {
    chaves.add(perfilParceria.fotoChave);
  }
  for (const foto of fotos) {
    chaves.add(foto.chave);
  }
  for (const jornada of jornadas) {
    if (jornada.fotoAntesChave) {
      chaves.add(jornada.fotoAntesChave);
    }
    if (jornada.fotoDepoisChave) {
      chaves.add(jornada.fotoDepoisChave);
    }
  }
  for (const participacao of participacoes) {
    if (participacao.fotoChave) {
      chaves.add(participacao.fotoChave);
    }
  }
  for (const marcacao of marcacoes) {
    if (marcacao.fotoChave) {
      chaves.add(marcacao.fotoChave);
    }
  }
  for (const post of posts) {
    if (post.imagemChave) {
      chaves.add(post.imagemChave);
    }
  }
  for (const plano of planos) {
    chaves.add(plano.arquivoChave);
  }

  return [...chaves];
}

export async function deletarMembro(userId: string) {
  return executarAction(async () => {
    const session = await requererAcessoPainel();

    if (session.user.id === userId) {
      throw new AppError("Você não pode deletar a própria conta.");
    }

    await garantirNaoUltimoAdminOuGestoraAtivo(
      userId,
      "Não é possível deletar: não sobraria nenhuma conta ADMIN ou GESTORA ativa.",
    );

    // Lista as chaves antes (o delete em cascata apaga os registros), mas só
    // apaga do R2 depois que o banco confirmou a exclusão.
    const chaves = await listarChavesDoUsuario(userId);
    await prisma.user.delete({ where: { id: userId } });
    await Promise.all(
      chaves.map((chave) =>
        apagarObjetoEmMelhorEsforco(chave, "deletarMembro"),
      ),
    );

    revalidatePath("/painel/membros");
  });
}

export async function promoverAParceria(userId: string) {
  return executarAction(async () => {
    await requererAcessoPainel();

    await prisma.usuarioPapel.upsert({
      where: { userId_papel: { userId, papel: "PARCERIA" } },
      create: { userId, papel: "PARCERIA" },
      update: {},
    });

    revalidatePath("/painel/membros");
  });
}

export async function revogarParceria(userId: string) {
  return executarAction(async () => {
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
  });
}

export async function promoverAGestora(userId: string) {
  return executarAction(async () => {
    const session = await requererAcessoPainel();
    garantirEhAdmin(session.user.papeis);

    await prisma.usuarioPapel.upsert({
      where: { userId_papel: { userId, papel: "GESTORA" } },
      create: { userId, papel: "GESTORA" },
      update: {},
    });

    revalidatePath("/painel/membros");
  });
}

export async function revogarGestora(userId: string) {
  return executarAction(async () => {
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
  });
}
