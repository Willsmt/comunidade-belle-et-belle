import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

  return {
    nome: usuario.name,
    bio: usuario.perfil?.bioPublica ? usuario.perfil.bio : null,
    emblemasPublicos: usuario.perfil?.emblemasPublicos ?? false,
    ultimaMedida,
  };
}
