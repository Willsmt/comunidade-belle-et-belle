import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gerarUrlAssinada } from "@/lib/storage/fotos";

export async function obterPerfilPublico(clienteId: string) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Sessão inválida");
  }

  const usuario = await prisma.user.findUnique({
    where: { id: clienteId },
    select: {
      name: true,
      perfil: true,
    },
  });

  if (!usuario) {
    return null;
  }

  const ultimaMedida = usuario.perfil?.medidasPublicas
    ? await prisma.registroMedida.findFirst({
        where: { clienteId },
        orderBy: { data: "desc" },
      })
    : null;

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

  return {
    nome: usuario.name,
    bio: usuario.perfil?.bioPublica ? usuario.perfil.bio : null,
    emblemasPublicos: usuario.perfil?.emblemasPublicos ?? false,
    ultimaMedida,
    fotos,
  };
}
