"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requererAcessoPainel } from "@/lib/auth/requerer-acesso-painel";
import {
  verificarConquistaRankingGeral,
  verificarConquistasRankingSemanal,
} from "@/lib/desafios/conquistas";
import { AppError, executarAction } from "@/lib/actions/executar-action";

function parseEmblemaIdOpcional(formData: FormData, campo: string) {
  const valor = formData.get(campo);
  return typeof valor === "string" && valor.trim() !== "" ? valor : null;
}

export async function criarDesafio(formData: FormData) {
  return executarAction(async () => {
    await requererAcessoPainel();

    const titulo = formData.get("titulo");
    const fraseMotivacional = formData.get("fraseMotivacional");
    const dataInicio = formData.get("dataInicio");
    const dataFim = formData.get("dataFim");
    const emblemaRankingSemanalId = parseEmblemaIdOpcional(formData, "emblemaRankingSemanalId");
    const emblemaRankingGeralId = parseEmblemaIdOpcional(formData, "emblemaRankingGeralId");

    if (typeof titulo !== "string" || titulo.trim() === "") {
      throw new AppError("Informe o título do desafio");
    }
    if (typeof dataInicio !== "string" || dataInicio === "") {
      throw new AppError("Informe a data de início");
    }
    if (typeof dataFim !== "string" || dataFim === "") {
      throw new AppError("Informe a data de fim");
    }

    const desafioAtivo = await prisma.desafio.findFirst({ where: { ativo: true } });
    if (desafioAtivo) {
      throw new AppError(
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
        emblemaRankingSemanalId,
        emblemaRankingGeralId,
      },
    });

    revalidatePath("/painel/desafios");
  });
}

export async function encerrarDesafio(desafioId: string) {
  return executarAction(async () => {
    await requererAcessoPainel();

    await prisma.desafio.update({
      where: { id: desafioId },
      data: { ativo: false },
    });

    await verificarConquistasRankingSemanal(desafioId);
    await verificarConquistaRankingGeral(desafioId);

    revalidatePath("/painel/desafios");
  });
}

export async function reabrirDesafio(desafioId: string) {
  return executarAction(async () => {
    await requererAcessoPainel();

    const desafioAtivo = await prisma.desafio.findFirst({ where: { ativo: true } });
    if (desafioAtivo && desafioAtivo.id !== desafioId) {
      throw new AppError(
        `Já existe um desafio ativo (${desafioAtivo.titulo}). Encerre-o antes de reabrir outro.`,
      );
    }

    await prisma.desafio.update({
      where: { id: desafioId },
      data: { ativo: true },
    });

    revalidatePath("/painel/desafios");
  });
}
