"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requererPapel } from "@/lib/auth/requerer-acesso-painel";
import { obterDataDeHoje } from "@/lib/hoje";
import { uploadComprovante } from "@/lib/storage/comprovantes-surpresa";
import { uploadFotoJornada, deletarFotoJornada } from "@/lib/storage/jornada-desafio";
import {
  verificarConquistasBonus,
  verificarConquistasRankingSemanal,
} from "@/lib/desafios/conquistas";

export async function alternarMarcacao(itemId: string) {
  const session = await requererPapel(["CLIENTE"]);
  const clienteId = session.user.id;

  const item = await prisma.itemDesafio.findUniqueOrThrow({
    where: { id: itemId },
    include: { categoria: true },
  });

  const hoje = obterDataDeHoje();

  const existente = await prisma.marcacaoItem.findUnique({
    where: { itemId_clienteId_data: { itemId, clienteId, data: hoje } },
  });

  if (existente) {
    await prisma.marcacaoItem.delete({ where: { id: existente.id } });
  } else {
    await prisma.marcacaoItem.create({
      data: { itemId, clienteId, data: hoje },
    });
    await verificarConquistasBonus(clienteId, item.categoria.desafioId, hoje);
  }

  await verificarConquistasRankingSemanal(item.categoria.desafioId, hoje);

  revalidatePath("/cliente/desafios");
}

export async function participarDesafioSurpresa(
  desafioSurpresaId: string,
  formData: FormData,
) {
  const session = await requererPapel(["CLIENTE"]);
  const clienteId = session.user.id;

  const surpresa = await prisma.desafioSurpresa.findUniqueOrThrow({
    where: { id: desafioSurpresaId },
  });

  const jaParticipou = await prisma.participacaoSurpresa.findUnique({
    where: {
      desafioSurpresaId_clienteId: { desafioSurpresaId, clienteId },
    },
  });
  if (jaParticipou) {
    throw new Error("Você já participou desse desafio surpresa");
  }

  let fotoChave: string | null = null;
  if (surpresa.exigeComprovacao) {
    const arquivo = formData.get("comprovacao");
    if (!(arquivo instanceof File) || arquivo.size === 0) {
      throw new Error("Envie a foto de comprovação");
    }
    fotoChave = await uploadComprovante(arquivo, clienteId);
  }

  await prisma.participacaoSurpresa.create({
    data: { desafioSurpresaId, clienteId, fotoChave },
  });

  revalidatePath("/cliente/desafios");
}

async function obterDesafioRelevante() {
  const ativo = await prisma.desafio.findFirst({ where: { ativo: true } });
  if (ativo) {
    return ativo;
  }
  return prisma.desafio.findFirst({
    where: { ativo: false },
    orderBy: { criadoEm: "desc" },
  });
}

async function enviarFotoJornada(
  clienteId: string,
  arquivo: FormDataEntryValue | null,
  campo: "fotoAntesChave" | "fotoDepoisChave",
) {
  const desafio = await obterDesafioRelevante();
  if (!desafio) {
    throw new Error("Nenhum desafio disponível no momento");
  }

  if (!(arquivo instanceof File) || arquivo.size === 0) {
    throw new Error("Envie uma foto");
  }

  const existente = await prisma.jornadaDesafio.findUnique({
    where: { desafioId_clienteId: { desafioId: desafio.id, clienteId } },
  });

  const novaChave = await uploadFotoJornada(arquivo, clienteId);

  const chaveAntiga = existente?.[campo];
  if (chaveAntiga) {
    await deletarFotoJornada(chaveAntiga);
  }

  await prisma.jornadaDesafio.upsert({
    where: { desafioId_clienteId: { desafioId: desafio.id, clienteId } },
    create: { desafioId: desafio.id, clienteId, [campo]: novaChave },
    update: { [campo]: novaChave },
  });

  revalidatePath("/cliente/desafios");
}

export async function enviarFotoAntes(formData: FormData) {
  const session = await requererPapel(["CLIENTE"]);
  await enviarFotoJornada(session.user.id, formData.get("foto"), "fotoAntesChave");
}

export async function enviarFotoDepois(formData: FormData) {
  const session = await requererPapel(["CLIENTE"]);
  await enviarFotoJornada(session.user.id, formData.get("foto"), "fotoDepoisChave");
}

export async function marcarAvisoEncerramentoVisto() {
  const session = await requererPapel(["CLIENTE"]);
  const clienteId = session.user.id;

  const desafio = await prisma.desafio.findFirst({
    where: { ativo: false },
    orderBy: { criadoEm: "desc" },
  });
  if (!desafio) {
    throw new Error("Nenhum desafio encerrado encontrado");
  }

  await prisma.jornadaDesafio.upsert({
    where: { desafioId_clienteId: { desafioId: desafio.id, clienteId } },
    create: { desafioId: desafio.id, clienteId, avisoEncerramentoVisto: true },
    update: { avisoEncerramentoVisto: true },
  });

  revalidatePath("/cliente/desafios");
}

export async function salvarReflexao(formData: FormData) {
  const session = await requererPapel(["CLIENTE"]);
  const clienteId = session.user.id;

  const desafio = await prisma.desafio.findFirst({
    where: { ativo: false },
    orderBy: { criadoEm: "desc" },
  });
  if (!desafio) {
    throw new Error("Nenhum desafio encerrado encontrado");
  }

  const parseTexto = (campo: string) => {
    const valor = formData.get(campo);
    return typeof valor === "string" && valor.trim() !== "" ? valor : null;
  };

  await prisma.jornadaDesafio.upsert({
    where: { desafioId_clienteId: { desafioId: desafio.id, clienteId } },
    create: {
      desafioId: desafio.id,
      clienteId,
      reflexaoMudou: parseTexto("reflexaoMudou"),
      reflexaoOrgulho: parseTexto("reflexaoOrgulho"),
      reflexaoContinuar: parseTexto("reflexaoContinuar"),
    },
    update: {
      reflexaoMudou: parseTexto("reflexaoMudou"),
      reflexaoOrgulho: parseTexto("reflexaoOrgulho"),
      reflexaoContinuar: parseTexto("reflexaoContinuar"),
    },
  });

  revalidatePath("/cliente/desafios");
}
