import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { obterDataDeHoje } from "@/lib/hoje";

function calcularSemanaAtual(dataInicio: Date, hoje: Date) {
  const diffDias = Math.floor(
    (hoje.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24),
  );
  const numeroSemana = Math.floor(diffDias / 7);
  const inicioSemana = new Date(dataInicio);
  inicioSemana.setUTCDate(inicioSemana.getUTCDate() + numeroSemana * 7);
  const fimSemana = new Date(inicioSemana);
  fimSemana.setUTCDate(fimSemana.getUTCDate() + 6);
  return { inicioSemana, fimSemana };
}

async function calcularRanking(desafioId: string, dataInicio?: Date, dataFim?: Date) {
  const marcacoes = await prisma.marcacaoItem.findMany({
    where: {
      item: { categoria: { desafioId } },
      ...(dataInicio && dataFim ? { data: { gte: dataInicio, lte: dataFim } } : {}),
    },
    include: {
      item: { select: { pontos: true } },
      cliente: { select: { id: true, name: true, email: true } },
    },
  });

  const pontosPorCliente = new Map<string, { nome: string; pontos: number }>();
  for (const marcacao of marcacoes) {
    const atual = pontosPorCliente.get(marcacao.clienteId) ?? {
      nome: marcacao.cliente.name ?? marcacao.cliente.email,
      pontos: 0,
    };
    atual.pontos += marcacao.item.pontos;
    pontosPorCliente.set(marcacao.clienteId, atual);
  }

  return [...pontosPorCliente.entries()]
    .map(([clienteId, dados]) => ({ clienteId, ...dados }))
    .sort((a, b) => b.pontos - a.pontos);
}

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
  const { inicioSemana, fimSemana } = calcularSemanaAtual(desafio.dataInicio, hoje);

  const [marcacoesHoje, rankingSemanal, rankingGeral] = await Promise.all([
    prisma.marcacaoItem.findMany({
      where: {
        clienteId: session.user.id,
        data: hoje,
        item: { categoria: { desafioId: desafio.id } },
      },
      select: { itemId: true },
    }),
    calcularRanking(desafio.id, inicioSemana, fimSemana),
    calcularRanking(desafio.id),
  ]);

  return {
    desafio,
    itensMarcadosHoje: new Set(marcacoesHoje.map((marcacao) => marcacao.itemId)),
    rankingSemanal,
    rankingGeral,
    clienteId: session.user.id,
  };
}
