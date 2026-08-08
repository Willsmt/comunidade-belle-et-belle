import { prisma } from "@/lib/prisma";

export function listarDesafios() {
  return prisma.desafio.findMany({
    orderBy: { dataInicio: "desc" },
    include: {
      _count: { select: { categorias: true } },
    },
  });
}
