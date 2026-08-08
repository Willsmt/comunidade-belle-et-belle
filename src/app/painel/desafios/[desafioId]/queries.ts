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
      regrasBonus: {
        orderBy: { criadoEm: "asc" },
        include: {
          itensCombo: true,
        },
      },
      desafiosSurpresa: {
        orderBy: { criadoEm: "desc" },
        include: {
          participacoes: {
            orderBy: { criadoEm: "asc" },
            include: {
              cliente: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
    },
  });
}
