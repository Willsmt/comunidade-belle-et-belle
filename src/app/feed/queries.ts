import { prisma } from "@/lib/prisma";
import { gerarUrlAssinada } from "@/lib/storage/objetos";

export async function listarPosts() {
  const posts = await prisma.post.findMany({
    orderBy: { criadoEm: "desc" },
    take: 20,
    include: { autor: { select: { id: true, name: true } } },
  });

  return Promise.all(
    posts.map(async (post) => ({
      ...post,
      urlImagem: post.imagemChave
        ? await gerarUrlAssinada(post.imagemChave)
        : null,
    })),
  );
}

export async function obterPost(postId: string) {
  return prisma.post.findUnique({ where: { id: postId } });
}

export async function listarFotosEvolucaoDoUsuario(usuarioId: string) {
  const fotos = await prisma.fotoEvolucao.findMany({
    where: { clienteId: usuarioId },
    orderBy: { data: "desc" },
  });

  return Promise.all(
    fotos.map(async (foto) => ({
      ...foto,
      urlAssinada: await gerarUrlAssinada(foto.chave),
    })),
  );
}
