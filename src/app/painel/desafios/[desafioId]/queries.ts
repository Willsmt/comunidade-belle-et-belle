import { prisma } from "@/lib/prisma";
import { gerarUrlAssinada } from "@/lib/storage/comprovantes-surpresa";

export async function obterDesafioComCategorias(desafioId: string) {
  const desafio = await prisma.desafio.findUnique({
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

  if (!desafio) {
    return null;
  }

  const desafiosSurpresa = await Promise.all(
    desafio.desafiosSurpresa.map(async (surpresa) => ({
      ...surpresa,
      participacoes: await Promise.all(
        surpresa.participacoes.map(async (participacao) => ({
          ...participacao,
          fotoUrl: participacao.fotoChave
            ? await gerarUrlAssinada(participacao.fotoChave)
            : null,
        })),
      ),
    })),
  );

  return { ...desafio, desafiosSurpresa };
}
