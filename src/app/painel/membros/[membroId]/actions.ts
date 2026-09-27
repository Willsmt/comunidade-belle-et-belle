"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requererAcessoPainel } from "@/lib/auth/requerer-acesso-painel";
import { obterDataDeHoje } from "@/lib/hoje";
import { AppError, executarAction } from "@/lib/actions/executar-action";

export async function vincularPacote(clienteId: string, tipoPacoteId: string) {
  return executarAction(async () => {
    await requererAcessoPainel();

    const tipoPacote = await prisma.tipoPacote.findUnique({
      where: { id: tipoPacoteId },
      include: { itens: true },
    });
    if (!tipoPacote) {
      throw new AppError("Tipo de pacote não encontrado");
    }

    await prisma.$transaction([
      prisma.cicloPacote.updateMany({
        where: { clienteId, ativo: true },
        data: { ativo: false, arquivadoEm: new Date() },
      }),
      prisma.cicloPacote.create({
        data: {
          clienteId,
          tipoPacoteId,
          nomePacote: tipoPacote.nome,
          ativo: true,
          itens: {
            create: tipoPacote.itens.map((item) => ({
              tipoSessaoId: item.tipoSessaoId,
              quantidadeContratada: item.quantidade,
            })),
          },
        },
      }),
    ]);

    revalidatePath(`/painel/membros/${clienteId}`);
  });
}

export async function marcarSessaoRealizada(
  cicloPacoteId: string,
  tipoSessaoId: string,
  data?: string,
) {
  return executarAction(async () => {
    const session = await requererAcessoPainel();

    const ciclo = await prisma.cicloPacote.findUnique({ where: { id: cicloPacoteId } });
    if (!ciclo || !ciclo.ativo) {
      throw new AppError("Este ciclo não está mais ativo");
    }

    const item = await prisma.itemCicloPacote.findUnique({
      where: { cicloPacoteId_tipoSessaoId: { cicloPacoteId, tipoSessaoId } },
    });
    if (!item) {
      throw new AppError("Este tipo de sessão não faz parte do pacote deste ciclo");
    }

    const realizadas = await prisma.sessaoRealizada.count({
      where: { cicloPacoteId, tipoSessaoId },
    });
    if (realizadas >= item.quantidadeContratada) {
      throw new AppError("O limite do pacote para esse tipo de sessão já foi cumprido");
    }

    await prisma.sessaoRealizada.create({
      data: {
        cicloPacoteId,
        tipoSessaoId,
        data: data ? new Date(data) : obterDataDeHoje(),
        marcadoPorId: session.user.id,
      },
    });

    revalidatePath(`/painel/membros/${ciclo.clienteId}`);
  });
}

export async function desfazerSessaoRealizada(sessaoRealizadaId: string) {
  return executarAction(async () => {
    await requererAcessoPainel();

    const sessao = await prisma.sessaoRealizada.findUnique({
      where: { id: sessaoRealizadaId },
      include: { cicloPacote: { select: { clienteId: true } } },
    });
    if (!sessao) {
      throw new AppError("Sessão não encontrada");
    }

    await prisma.sessaoRealizada.delete({ where: { id: sessaoRealizadaId } });

    revalidatePath(`/painel/membros/${sessao.cicloPacote.clienteId}`);
  });
}
