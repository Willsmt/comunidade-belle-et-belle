import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function obterPerfilParceriaProprio() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Sessão inválida");
  }
  return prisma.perfilParceria.findUnique({
    where: { usuarioId: session.user.id },
  });
}
