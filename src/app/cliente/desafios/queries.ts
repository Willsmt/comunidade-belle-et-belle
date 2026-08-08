import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { obterDataDeHoje } from "@/lib/hoje";

export async function obterDesafioAtivoParaCliente() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Sessão inválida");
  }

  const desafio = await prisma.desafio.findFirst({
    where: { ativo: true },
    include: {
      categorias: {
        orderBy: { nome: "asc" },
        include: {
          itens: { orderBy: { descricao: "asc" } },
        },
      },
    },
  });

  if (!desafio) {
    return null;
  }

  const hoje = obterDataDeHoje();

  const marcacoesHoje = await prisma.marcacaoItem.findMany({
    where: {
      clienteId: session.user.id,
      data: hoje,
      item: { categoria: { desafioId: desafio.id } },
    },
    select: { itemId: true },
  });

  return {
    desafio,
    itensMarcadosHoje: new Set(marcacoesHoje.map((marcacao) => marcacao.itemId)),
  };
}
