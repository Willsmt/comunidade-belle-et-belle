import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function listarClientesVinculadas() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Sessão inválida");
  }

  const vinculos = await prisma.vinculoParceria.findMany({
    where: { parceriaId: session.user.id, ativo: true },
    include: { cliente: { select: { id: true, name: true, email: true } } },
    orderBy: { criadoEm: "asc" },
  });

  return vinculos.map((vinculo) => vinculo.cliente);
}

export async function listarPlanosEnviados() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Sessão inválida");
  }

  return prisma.planoRecebido.findMany({
    where: { parceriaId: session.user.id },
    orderBy: { enviadoEm: "desc" },
    include: { cliente: { select: { id: true, name: true, email: true } } },
  });
}
