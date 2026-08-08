import { prisma } from "@/lib/prisma";

export function listarPendentes() {
  return prisma.user.findMany({
    where: { status: "PENDENTE" },
    orderBy: { criadoEm: "asc" },
    select: { id: true, name: true, email: true, image: true, criadoEm: true },
  });
}
