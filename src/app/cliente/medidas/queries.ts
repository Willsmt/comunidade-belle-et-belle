import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function listarMedidas() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Sessão inválida");
  }

  return prisma.registroMedida.findMany({
    where: { clienteId: session.user.id },
    orderBy: { data: "desc" },
  });
}
