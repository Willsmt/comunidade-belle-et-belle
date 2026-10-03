"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { AppError, executarAction } from "@/lib/actions/executar-action";
import { requererPapel } from "@/lib/auth/requerer-acesso-painel";
import { uploadFoto, deletarFoto } from "@/lib/storage/fotos";

export async function enviarFoto(formData: FormData) {
  return executarAction(async () => {
    const session = await requererPapel(["CLIENTE"]);

    const arquivo = formData.get("arquivo");
    if (!(arquivo instanceof File) || arquivo.size === 0) {
      throw new AppError("Selecione uma imagem");
    }

    const chave = await uploadFoto(arquivo, session.user.id);

    await prisma.fotoEvolucao.create({
      data: { clienteId: session.user.id, chave },
    });

    revalidatePath("/cliente/fotos");
  });
}

async function obterFotoDoUsuario(fotoId: string, clienteId: string) {
  const foto = await prisma.fotoEvolucao.findUnique({ where: { id: fotoId } });
  if (!foto || foto.clienteId !== clienteId) {
    throw new AppError("Foto não encontrada");
  }
  return foto;
}

export async function alternarVisibilidadeFoto(formData: FormData) {
  return executarAction(async () => {
    const session = await requererPapel(["CLIENTE"]);

    const fotoId = formData.get("fotoId");
    if (typeof fotoId !== "string") {
      throw new AppError("Foto inválida");
    }

    const foto = await obterFotoDoUsuario(fotoId, session.user.id);

    if (foto.publica) {
      // Post só pode usar foto pública: ao torná-la privada, os posts que a
      // usam saem do feed na mesma transação. O objeto no R2 não é apagado.
      await prisma.$transaction([
        prisma.post.deleteMany({ where: { fotoEvolucaoId: fotoId, autorId: session.user.id } }),
        prisma.fotoEvolucao.update({
          where: { id: fotoId },
          data: { publica: false },
        }),
      ]);
    } else {
      await prisma.fotoEvolucao.update({
        where: { id: fotoId },
        data: { publica: true },
      });
    }

    revalidatePath("/feed");

    revalidatePath("/cliente/fotos");
    revalidatePath(`/perfil/${session.user.id}`);
  });
}

export async function excluirFoto(formData: FormData) {
  return executarAction(async () => {
    const session = await requererPapel(["CLIENTE"]);

    const fotoId = formData.get("fotoId");
    if (typeof fotoId !== "string") {
      throw new AppError("Foto inválida");
    }

    const foto = await obterFotoDoUsuario(fotoId, session.user.id);

    await prisma.$transaction([
      prisma.post.deleteMany({ where: { fotoEvolucaoId: fotoId, autorId: session.user.id } }),
      prisma.fotoEvolucao.delete({ where: { id: fotoId } }),
    ]);

    // Só depois do commit: objeto órfão no R2 é preferível a registro
    // apontando para arquivo inexistente.
    try {
      await deletarFoto(foto.chave);
    } catch (erro) {
      console.error("Falha ao apagar objeto da foto no R2:", foto.chave, erro);
    }

    revalidatePath("/feed");
    revalidatePath("/cliente/fotos");
    revalidatePath(`/perfil/${session.user.id}`);
  });
}
