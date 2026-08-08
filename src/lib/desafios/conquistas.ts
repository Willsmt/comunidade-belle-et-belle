import { prisma } from "@/lib/prisma";
import { obterDataDeHoje } from "@/lib/hoje";

async function calcularRankingParaConquista(
  desafioId: string,
  dataInicio?: Date,
  dataFim?: Date,
) {
  const marcacoes = await prisma.marcacaoItem.findMany({
    where: {
      item: { categoria: { desafioId } },
      ...(dataInicio && dataFim ? { data: { gte: dataInicio, lte: dataFim } } : {}),
    },
    include: {
      item: { select: { pontos: true } },
    },
  });

  const pontosPorCliente = new Map<string, number>();
  for (const marcacao of marcacoes) {
    const atual = pontosPorCliente.get(marcacao.clienteId) ?? 0;
    pontosPorCliente.set(marcacao.clienteId, atual + marcacao.item.pontos);
  }

  return [...pontosPorCliente.entries()]
    .map(([clienteId, pontos]) => ({ clienteId, pontos }))
    .sort((a, b) => b.pontos - a.pontos);
}

async function regraSatisfeitaHoje(
  regra: {
    id: string;
    desafioId: string;
    tipo: string;
    limiarItens: number | null;
    categoriaId: string | null;
    itensCombo: { id: string }[];
  },
  clienteId: string,
  hoje: Date,
): Promise<boolean> {
  if (regra.tipo === "LIMIAR_DIARIO") {
    if (regra.limiarItens === null) return false;
    const quantidade = await prisma.marcacaoItem.count({
      where: {
        clienteId,
        data: hoje,
        item: { categoria: { desafioId: regra.desafioId } },
      },
    });
    return quantidade >= regra.limiarItens;
  }

  if (regra.tipo === "COMBO") {
    if (regra.itensCombo.length === 0) return false;
    const marcados = await prisma.marcacaoItem.count({
      where: {
        clienteId,
        data: hoje,
        itemId: { in: regra.itensCombo.map((item) => item.id) },
      },
    });
    return marcados === regra.itensCombo.length;
  }

  if (regra.tipo === "CATEGORIA_COMPLETA") {
    if (!regra.categoriaId) return false;
    const totalItens = await prisma.itemDesafio.count({
      where: { categoriaId: regra.categoriaId },
    });
    if (totalItens === 0) return false;
    const marcados = await prisma.marcacaoItem.count({
      where: {
        clienteId,
        data: hoje,
        item: { categoriaId: regra.categoriaId },
      },
    });
    return marcados === totalItens;
  }

  return false;
}

export async function verificarConquistasBonus(
  clienteId: string,
  desafioId: string,
  hoje: Date,
) {
  const regras = await prisma.regraBonus.findMany({
    where: { desafioId, emblemaId: { not: null } },
    include: { itensCombo: { select: { id: true } } },
  });

  for (const regra of regras) {
    if (!regra.emblemaId) continue;

    const jaTem = await prisma.conquista.findFirst({
      where: { clienteId, desafioId, tipo: "BONUS", referencia: regra.id },
    });
    if (jaTem) continue;

    const satisfeita = await regraSatisfeitaHoje(regra, clienteId, hoje);
    if (satisfeita) {
      await prisma.conquista.create({
        data: {
          clienteId,
          desafioId,
          emblemaId: regra.emblemaId,
          tipo: "BONUS",
          referencia: regra.id,
        },
      });
    }
  }
}

export async function verificarConquistasRankingSemanal(
  desafioId: string,
  hoje: Date = obterDataDeHoje(),
) {
  const desafio = await prisma.desafio.findUniqueOrThrow({
    where: { id: desafioId },
  });

  if (!desafio.emblemaRankingSemanalId) return;

  const diffDias = Math.floor(
    (hoje.getTime() - desafio.dataInicio.getTime()) / (1000 * 60 * 60 * 24),
  );
  const semanaAtual = Math.floor(diffDias / 7);

  for (let semana = 0; semana < semanaAtual; semana++) {
    const referencia = `semana-${semana}`;

    const jaPremiada = await prisma.conquista.findFirst({
      where: { desafioId, tipo: "RANKING_SEMANAL", referencia },
    });
    if (jaPremiada) continue;

    const inicioSemana = new Date(desafio.dataInicio);
    inicioSemana.setUTCDate(inicioSemana.getUTCDate() + semana * 7);
    const fimSemana = new Date(inicioSemana);
    fimSemana.setUTCDate(fimSemana.getUTCDate() + 6);

    const ranking = await calcularRankingParaConquista(desafioId, inicioSemana, fimSemana);
    if (ranking.length === 0 || ranking[0].pontos === 0) continue;

    const maiorPontuacao = ranking[0].pontos;
    const vencedores = ranking.filter((linha) => linha.pontos === maiorPontuacao);

    for (const vencedor of vencedores) {
      await prisma.conquista.create({
        data: {
          clienteId: vencedor.clienteId,
          desafioId,
          emblemaId: desafio.emblemaRankingSemanalId,
          tipo: "RANKING_SEMANAL",
          referencia,
        },
      });
    }
  }
}

export async function verificarConquistaRankingGeral(desafioId: string) {
  const desafio = await prisma.desafio.findUniqueOrThrow({
    where: { id: desafioId },
  });

  if (!desafio.emblemaRankingGeralId) return;

  const jaPremiada = await prisma.conquista.findFirst({
    where: { desafioId, tipo: "RANKING_GERAL" },
  });
  if (jaPremiada) return;

  const ranking = await calcularRankingParaConquista(desafioId);
  if (ranking.length === 0 || ranking[0].pontos === 0) return;

  const maiorPontuacao = ranking[0].pontos;
  const vencedores = ranking.filter((linha) => linha.pontos === maiorPontuacao);

  for (const vencedor of vencedores) {
    await prisma.conquista.create({
      data: {
        clienteId: vencedor.clienteId,
        desafioId,
        emblemaId: desafio.emblemaRankingGeralId,
        tipo: "RANKING_GERAL",
        referencia: null,
      },
    });
  }
}
