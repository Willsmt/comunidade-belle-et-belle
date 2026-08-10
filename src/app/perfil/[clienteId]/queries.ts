import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gerarUrlAssinada } from "@/lib/storage/fotos";
import { gerarUrlAssinada as gerarUrlAssinadaPerfil } from "@/lib/storage/perfil";

export async function obterPerfilPublico(clienteId: string) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Sessão inválida");
  }

  const usuario = await prisma.user.findUnique({
    where: { id: clienteId },
    select: {
      name: true,
      image: true,
      perfil: true,
    },
  });

  if (!usuario) {
    return null;
  }

  const fotoUrl = usuario.perfil?.fotoChave
    ? await gerarUrlAssinadaPerfil(usuario.perfil.fotoChave)
    : (usuario.image ?? null);

  const ultimaMedida = usuario.perfil?.medidasPublicas
    ? await prisma.registroMedida.findFirst({
        where: { clienteId },
        orderBy: { data: "desc" },
      })
    : null;

  const conquistas = usuario.perfil?.emblemasPublicos
    ? await prisma.conquista.findMany({
        where: { clienteId },
        orderBy: { criadoEm: "desc" },
        include: { emblema: true },
      })
    : [];

  const fotosPublicas = await prisma.fotoEvolucao.findMany({
    where: { clienteId, publica: true },
    orderBy: { data: "desc" },
  });

  const fotos = await Promise.all(
    fotosPublicas.map(async (foto) => ({
      id: foto.id,
      data: foto.data,
      urlAssinada: await gerarUrlAssinada(foto.chave),
    })),
  );

  const postsDoAutor = await prisma.post.findMany({
    where: { autorId: clienteId },
    orderBy: { criadoEm: "desc" },
  });

  const posts = await Promise.all(
    postsDoAutor.map(async (post) => ({
      id: post.id,
      texto: post.texto,
      criadoEm: post.criadoEm,
      urlImagem: post.imagemChave
        ? await gerarUrlAssinada(post.imagemChave)
        : null,
    })),
  );

  return {
    nome: usuario.name,
    fotoUrl,
    bio: usuario.perfil?.bioPublica ? usuario.perfil.bio : null,
    emblemasPublicos: usuario.perfil?.emblemasPublicos ?? false,
    conquistas: conquistas.map((conquista) => ({
      id: conquista.id,
      nome: conquista.emblema.nome,
      icone: conquista.emblema.icone,
      descricao: conquista.emblema.descricao,
    })),
    ultimaMedida,
    fotos,
    posts,
  };
}
