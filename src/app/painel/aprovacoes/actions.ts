"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requererAcessoPainel } from "@/lib/auth/requerer-acesso-painel";
import { deletarComprovanteItem } from "@/lib/storage/comprovantes-item-desafio";
import {
  verificarConquistasBonus,
  verificarConquistasRankingSemanal,
} from "@/lib/desafios/conquistas";
import { AppError, executarAction } from "@/lib/actions/executar-action";

export async function aprovarConta(userId: string) {
  return executarAction(async () => {
    const session = await requererAcessoPainel();

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          status: "ATIVO",
          aprovadoPor: session.user.id,
          aprovadoEm: new Date(),
        },
      }),
      prisma.usuarioPapel.upsert({
        where: { userId_papel: { userId, papel: "CLIENTE" } },
        create: { userId, papel: "CLIENTE" },
        update: {},
      }),
    ]);

    revalidatePath("/painel/aprovacoes");
  });
}

export async function rejeitarConta(userId: string) {
  return executarAction(async () => {
    await requererAcessoPainel();

    await prisma.user.delete({ where: { id: userId } });

    revalidatePath("/painel/aprovacoes");
  });
}

export async function aprovarMarcacaoItem(marcacaoId: string) {
  return executarAction(async () => {
    const session = await requererAcessoPainel();

    const marcacao = await prisma.marcacaoItem.findUniqueOrThrow({
      where: { id: marcacaoId },
      include: { item: { include: { categoria: true } } },
    });

    if (marcacao.validado) {
      throw new AppError("Essa marcação já foi aprovada");
    }

    await prisma.marcacaoItem.update({
      where: { id: marcacaoId },
      data: {
        validado: true,
        validadoPor: session.user.id,
        validadoEm: new Date(),
        fotoChave: null,
      },
    });

    if (marcacao.fotoChave) {
      await deletarComprovanteItem(marcacao.fotoChave);
    }

    const desafioId = marcacao.item.categoria.desafioId;
    await verificarConquistasBonus(marcacao.clienteId, desafioId, marcacao.data);
    await verificarConquistasRankingSemanal(desafioId, marcacao.data);

    revalidatePath("/painel/aprovacoes");
    revalidatePath("/cliente/desafios");
  });
}

export async function rejeitarMarcacaoItem(marcacaoId: string) {
  return executarAction(async () => {
    await requererAcessoPainel();

    const marcacao = await prisma.marcacaoItem.findUniqueOrThrow({
      where: { id: marcacaoId },
    });

    if (marcacao.fotoChave) {
      await deletarComprovanteItem(marcacao.fotoChave);
    }

    await prisma.marcacaoItem.delete({ where: { id: marcacaoId } });

    revalidatePath("/painel/aprovacoes");
    revalidatePath("/cliente/desafios");
  });
}
