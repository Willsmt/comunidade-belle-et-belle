import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function obterPerfilProprio() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Sessão inválida");
  }

  return prisma.perfil.findUnique({
    where: { userId: session.user.id },
  });
}
