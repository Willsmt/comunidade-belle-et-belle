"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requererAcessoPainel } from "@/lib/auth/requerer-acesso-painel";
import { apagarObjetoEmMelhorEsforco } from "@/lib/storage/objetos";
import { AppError, executarAction } from "@/lib/actions/executar-action";

// Só chamar depois que o banco confirmou a remoção dos registros.
async function apagarComprovantes(chaves: string[], contexto: string) {
  await Promise.all(
    chaves.map((chave) => apagarObjetoEmMelhorEsforco(chave, contexto)),
  );
}

function chavesNaoNulas(registros: { fotoChave: string | null }[]): string[] {
  return registros.flatMap((r) => (r.fotoChave ? [r.fotoChave] : []));
}

export async function criarCategoria(desafioId: string, formData: FormData) {
  return executarAction(async () => {
    await requererAcessoPainel();

    const nome = formData.get("nome");
    const cor = formData.get("cor");

    if (typeof nome !== "string" || nome.trim() === "") {
      throw new AppError("Informe o nome da categoria");
    }
    if (typeof cor !== "string" || cor.trim() === "") {
      throw new AppError("Informe a cor da categoria");
    }

    await prisma.categoriaDesafio.create({
      data: { desafioId, nome, cor },
    });

    revalidatePath(`/painel/desafios/${desafioId}`);
  });
}

export async function removerCategoria(categoriaId: string) {
  return executarAction(async () => {
    await requererAcessoPainel();

    // O delete em cascata leva itens e marcações: lista os comprovantes antes.
    const marcacoes = await prisma.marcacaoItem.findMany({
      where: { item: { categoriaId }, fotoChave: { not: null } },
      select: { fotoChave: true },
    });

    const categoria = await prisma.categoriaDesafio.delete({
      where: { id: categoriaId },
    });

    await apagarComprovantes(chavesNaoNulas(marcacoes), "removerCategoria");

    revalidatePath(`/painel/desafios/${categoria.desafioId}`);
  });
}

export async function criarItem(categoriaId: string, formData: FormData) {
  return executarAction(async () => {
    await requererAcessoPainel();

    const descricao = formData.get("descricao");
    const pontosRaw = formData.get("pontos");
    const frequencia = formData.get("frequencia");
    const exigeFoto = formData.get("exigeFoto") === "on";

    if (typeof descricao !== "string" || descricao.trim() === "") {
      throw new AppError("Informe a descrição do item");
    }

    const pontos = typeof pontosRaw === "string" ? Number(pontosRaw) : NaN;
    if (!Number.isInteger(pontos) || pontos <= 0) {
      throw new AppError("Informe uma pontuação válida");
    }

    if (frequencia !== "DIARIO" && frequencia !== "SEMANAL") {
      throw new AppError("Informe uma frequência válida");
    }

    const categoria = await prisma.categoriaDesafio.findUniqueOrThrow({
      where: { id: categoriaId },
    });

    await prisma.itemDesafio.create({
      data: { categoriaId, descricao, pontos, frequencia, exigeFoto },
    });

    revalidatePath(`/painel/desafios/${categoria.desafioId}`);
  });
}

export async function removerItem(itemId: string) {
  return executarAction(async () => {
    await requererAcessoPainel();

    const marcacoes = await prisma.marcacaoItem.findMany({
      where: { itemId, fotoChave: { not: null } },
      select: { fotoChave: true },
    });

    const item = await prisma.itemDesafio.delete({
      where: { id: itemId },
      include: { categoria: true },
    });

    await apagarComprovantes(chavesNaoNulas(marcacoes), "removerItem");

    revalidatePath(`/painel/desafios/${item.categoria.desafioId}`);
  });
}

export async function alternarExigeFoto(itemId: string) {
  return executarAction(async () => {
    await requererAcessoPainel();

    const item = await prisma.itemDesafio.findUniqueOrThrow({
      where: { id: itemId },
      include: { categoria: true },
    });

    await prisma.itemDesafio.update({
      where: { id: itemId },
      data: { exigeFoto: !item.exigeFoto },
    });

    revalidatePath(`/painel/desafios/${item.categoria.desafioId}`);
  });
}

function parsePontosExtras(formData: FormData) {
  const pontosRaw = formData.get("pontosExtras");
  const pontos = typeof pontosRaw === "string" ? Number(pontosRaw) : NaN;

  if (!Number.isInteger(pontos) || pontos <= 0) {
    throw new AppError("Informe uma pontuação extra válida");
  }

  return pontos;
}

function parseEmblemaIdOpcional(formData: FormData) {
  const valor = formData.get("emblemaId");
  return typeof valor === "string" && valor.trim() !== "" ? valor : null;
}

export async function criarRegraLimiar(desafioId: string, formData: FormData) {
  return executarAction(async () => {
    await requererAcessoPainel();

    const pontosExtras = parsePontosExtras(formData);
    const emblemaId = parseEmblemaIdOpcional(formData);

    const limiarRaw = formData.get("limiarItens");
    const limiarItens = typeof limiarRaw === "string" ? Number(limiarRaw) : NaN;
    if (!Number.isInteger(limiarItens) || limiarItens <= 0) {
      throw new AppError("Informe um limiar de itens válido");
    }

    await prisma.regraBonus.create({
      data: { desafioId, tipo: "LIMIAR_DIARIO", pontosExtras, limiarItens, emblemaId },
    });

    revalidatePath(`/painel/desafios/${desafioId}`);
  });
}

export async function criarRegraCombo(desafioId: string, formData: FormData) {
  return executarAction(async () => {
    await requererAcessoPainel();

    const pontosExtras = parsePontosExtras(formData);
    const emblemaId = parseEmblemaIdOpcional(formData);

    const itensCombo = formData
      .getAll("itensCombo")
      .filter((valor): valor is string => typeof valor === "string");
    if (itensCombo.length < 2) {
      throw new AppError("Selecione pelo menos 2 itens pro combo");
    }

    await prisma.regraBonus.create({
      data: {
        desafioId,
        tipo: "COMBO",
        pontosExtras,
        emblemaId,
        itensCombo: { connect: itensCombo.map((id) => ({ id })) },
      },
    });

    revalidatePath(`/painel/desafios/${desafioId}`);
  });
}

export async function criarRegraCategoriaCompleta(desafioId: string, formData: FormData) {
  return executarAction(async () => {
    await requererAcessoPainel();

    const pontosExtras = parsePontosExtras(formData);
    const emblemaId = parseEmblemaIdOpcional(formData);

    const categoriaId = formData.get("categoriaId");
    if (typeof categoriaId !== "string" || categoriaId === "") {
      throw new AppError("Selecione a categoria");
    }

    await prisma.categoriaDesafio.findUniqueOrThrow({ where: { id: categoriaId } });

    await prisma.regraBonus.create({
      data: { desafioId, tipo: "CATEGORIA_COMPLETA", pontosExtras, categoriaId, emblemaId },
    });

    revalidatePath(`/painel/desafios/${desafioId}`);
  });
}

export async function removerRegraBonus(regraId: string) {
  return executarAction(async () => {
    await requererAcessoPainel();

    const regra = await prisma.regraBonus.delete({
      where: { id: regraId },
    });

    revalidatePath(`/painel/desafios/${regra.desafioId}`);
  });
}

export async function criarDesafioSurpresa(desafioId: string, formData: FormData) {
  return executarAction(async () => {
    await requererAcessoPainel();

    const titulo = formData.get("titulo");
    const descricao = formData.get("descricao");
    const pontosRaw = formData.get("pontos");
    const exigeComprovacao = formData.get("exigeComprovacao") === "on";

    if (typeof titulo !== "string" || titulo.trim() === "") {
      throw new AppError("Informe o título do desafio surpresa");
    }

    const pontos = typeof pontosRaw === "string" ? Number(pontosRaw) : NaN;
    if (!Number.isInteger(pontos) || pontos <= 0) {
      throw new AppError("Informe uma pontuação válida");
    }

    await prisma.desafioSurpresa.create({
      data: {
        desafioId,
        titulo,
        descricao: typeof descricao === "string" && descricao.trim() !== "" ? descricao : null,
        pontos,
        exigeComprovacao,
      },
    });

    revalidatePath(`/painel/desafios/${desafioId}`);
  });
}

export async function removerDesafioSurpresa(desafioSurpresaId: string) {
  return executarAction(async () => {
    await requererAcessoPainel();

    const participacoes = await prisma.participacaoSurpresa.findMany({
      where: { desafioSurpresaId, fotoChave: { not: null } },
      select: { fotoChave: true },
    });

    const desafioSurpresa = await prisma.desafioSurpresa.delete({
      where: { id: desafioSurpresaId },
    });

    await apagarComprovantes(
      chavesNaoNulas(participacoes),
      "removerDesafioSurpresa",
    );

    revalidatePath(`/painel/desafios/${desafioSurpresa.desafioId}`);
  });
}

export async function aprovarParticipacao(participacaoId: string) {
  return executarAction(async () => {
    const session = await requererAcessoPainel();

    // O comprovante só serve para a análise: ao aprovar, a chave sai do
    // registro na mesma escrita e o objeto é apagado depois.
    const anterior = await prisma.participacaoSurpresa.findUniqueOrThrow({
      where: { id: participacaoId },
    });

    const participacao = await prisma.participacaoSurpresa.update({
      where: { id: participacaoId },
      data: {
        validado: true,
        validadoPor: session.user.id,
        validadoEm: new Date(),
        fotoChave: null,
      },
      include: { desafioSurpresa: true },
    });

    if (anterior.fotoChave) {
      await apagarObjetoEmMelhorEsforco(
        anterior.fotoChave,
        "aprovarParticipacao",
      );
    }

    revalidatePath(`/painel/desafios/${participacao.desafioSurpresa.desafioId}`);
    revalidatePath("/painel/aprovacoes");
  });
}

export async function rejeitarParticipacao(participacaoId: string) {
  return executarAction(async () => {
    await requererAcessoPainel();

    const participacao = await prisma.participacaoSurpresa.delete({
      where: { id: participacaoId },
      include: { desafioSurpresa: true },
    });

    if (participacao.fotoChave) {
      await apagarObjetoEmMelhorEsforco(
        participacao.fotoChave,
        "rejeitarParticipacao",
      );
    }

    revalidatePath(`/painel/desafios/${participacao.desafioSurpresa.desafioId}`);
    revalidatePath("/painel/aprovacoes");
  });
}
