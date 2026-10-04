import { requererAcessoPainelOuRedirecionar } from "@/lib/auth/requerer-acesso-painel";
import { prisma } from "@/lib/prisma";

export async function listarDesafios() {
  await requererAcessoPainelOuRedirecionar();

  return prisma.desafio.findMany({
    orderBy: { dataInicio: "desc" },
    include: {
      _count: { select: { categorias: true } },
    },
  });
}
