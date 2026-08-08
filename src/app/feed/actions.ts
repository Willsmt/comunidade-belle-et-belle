"use server";

import { revalidatePath } from "next/cache";
import type { Papel } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requererSessao } from "@/lib/auth/requerer-acesso-painel";
import { temAlgumPapel } from "@/lib/auth/pode-acessar-painel";
import { uploadImagemPost, deletarImagemPost } from "@/lib/storage/posts";

const PAPEIS_MODERACAO: readonly Papel[] = ["GESTORA", "ADMIN"];

export async function criarPost(formData: FormData) {
  const session = await requererSessao();

  const texto = formData.get("texto");
  const arquivo = formData.get("arquivo");
  const fotoEvolucaoId = formData.get("fotoEvolucaoId");

  const textoValido =
    typeof texto === "string" && texto.trim() !== "" ? texto.trim() : null;

  let imagemChave: string | null = null;
  let fotoEvolucaoIdValido: string | null = null;

  if (arquivo instanceof File && arquivo.size > 0) {
    imagemChave = await uploadImagemPost(arquivo, session.user.id);
  } else if (typeof fotoEvolucaoId === "string" && fotoEvolucaoId !== "") {
    const foto = await prisma.fotoEvolucao.findUnique({
      where: { id: fotoEvolucaoId },
    });
    if (!foto || foto.clienteId !== session.user.id) {
      throw new Error("Foto de evolução inválida");
    }
    imagemChave = foto.chave;
    fotoEvolucaoIdValido = foto.id;
  }

  if (!textoValido && !imagemChave) {
    throw new Error("O post precisa de um texto ou uma imagem");
  }

  await prisma.post.create({
    data: {
      autorId: session.user.id,
      texto: textoValido,
      imagemChave,
      fotoEvolucaoId: fotoEvolucaoIdValido,
    },
  });

  revalidatePath("/feed");
}

async function obterPostAutorizado(
  postId: string,
  session: Awaited<ReturnType<typeof requererSessao>>,
) {
  const post = await prisma.post.findUnique({ where: { id: postId } });

  if (!post) {
    throw new Error("Post não encontrado");
  }

  const podeModerar = temAlgumPapel(session.user.papeis, [
    ...PAPEIS_MODERACAO,
  ]);

  if (post.autorId !== session.user.id && !podeModerar) {
    throw new Error("Acesso negado");
  }

  return post;
}

export async function editarPost(formData: FormData) {
  const session = await requererSessao();

  const postId = formData.get("postId");
  if (typeof postId !== "string") {
    throw new Error("Post inválido");
  }

  const post = await obterPostAutorizado(postId, session);

  if (post.autorId !== session.user.id) {
    throw new Error("Só o autor pode editar o post");
  }

  const texto = formData.get("texto");
  const arquivo = formData.get("arquivo");

  const textoValido =
    typeof texto === "string" && texto.trim() !== "" ? texto.trim() : null;

  let imagemChave = post.imagemChave;
  let fotoEvolucaoId = post.fotoEvolucaoId;

  if (arquivo instanceof File && arquivo.size > 0) {
    if (post.imagemChave && !post.fotoEvolucaoId) {
      await deletarImagemPost(post.imagemChave);
    }
    imagemChave = await uploadImagemPost(arquivo, session.user.id);
    fotoEvolucaoId = null;
  }

  if (!textoValido && !imagemChave) {
    throw new Error("O post precisa de um texto ou uma imagem");
  }

  await prisma.post.update({
    where: { id: postId },
    data: { texto: textoValido, imagemChave, fotoEvolucaoId },
  });

  revalidatePath("/feed");
}

export async function apagarPost(formData: FormData) {
  const session = await requererSessao();

  const postId = formData.get("postId");
  if (typeof postId !== "string") {
    throw new Error("Post inválido");
  }

  const post = await obterPostAutorizado(postId, session);

  if (post.imagemChave && !post.fotoEvolucaoId) {
    await deletarImagemPost(post.imagemChave);
  }

  await prisma.post.delete({ where: { id: postId } });

  revalidatePath("/feed");
}
