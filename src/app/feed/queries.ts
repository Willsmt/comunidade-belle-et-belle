import { prisma } from "@/lib/prisma";
import { gerarUrlAssinada } from "@/lib/storage/objetos";

const TAMANHO_PAGINA = 10;

export async function listarPosts(usuarioId: string, cursor?: string) {
  const posts = await prisma.post.findMany({
    orderBy: { criadoEm: "desc" },
    take: TAMANHO_PAGINA + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      autor: { select: { id: true, name: true } },
      likes: { where: { usuarioId }, select: { id: true } },
      comentarios: {
        orderBy: { criadoEm: "asc" },
        include: { autor: { select: { id: true, name: true } } },
      },
      _count: { select: { likes: true } },
    },
  });

  const temMais = posts.length > TAMANHO_PAGINA;
  const pagina = temMais ? posts.slice(0, TAMANHO_PAGINA) : posts;

  const paginaComUrl = await Promise.all(
    pagina.map(async (post) => ({
      ...post,
      urlImagem: post.imagemChave
        ? await gerarUrlAssinada(post.imagemChave)
        : null,
      curtidoPeloUsuario: post.likes.length > 0,
      totalCurtidas: post._count.likes,
    })),
  );

  return {
    posts: paginaComUrl,
    proximoCursor: temMais ? pagina[pagina.length - 1].id : null,
  };
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

export async function obterTeaserDesafioAtivo() {
  return prisma.desafio.findFirst({
    where: { ativo: true },
    select: { id: true, titulo: true, dataFim: true },
  });
}
