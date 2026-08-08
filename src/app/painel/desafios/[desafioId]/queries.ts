import { prisma } from "@/lib/prisma";

export function obterDesafioComCategorias(desafioId: string) {
  return prisma.desafio.findUnique({
    where: { id: desafioId },
    include: {
      categorias: {
        orderBy: { nome: "asc" },
        include: {
          itens: { orderBy: { descricao: "asc" } },
        },
      },
    },
  });
}
