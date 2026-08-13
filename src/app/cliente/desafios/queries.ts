import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { obterDataDeHoje } from "@/lib/hoje";
import { gerarUrlAssinada } from "@/lib/storage/jornada-desafio";
import { gerarUrlAssinada as gerarUrlAssinadaPerfil } from "@/lib/storage/perfil";

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
      cliente: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          perfil: { select: { fotoChave: true } },
        },
      },
    },
  });

  const pontosPorCliente = new Map<
    string,
    { nome: string; pontos: number; image: string | null; fotoChave: string | null }
  >();
  for (const marcacao of marcacoes) {
    const atual = pontosPorCliente.get(marcacao.clienteId) ?? {
      nome: marcacao.cliente.name ?? marcacao.cliente.email,
      pontos: 0,
      image: marcacao.cliente.image,
      fotoChave: marcacao.cliente.perfil?.fotoChave ?? null,
    };
    atual.pontos += marcacao.item.pontos;
    pontosPorCliente.set(marcacao.clienteId, atual);
  }

  const linhas = await Promise.all(
    [...pontosPorCliente.entries()].map(async ([clienteId, dados]) => ({
      clienteId,
      nome: dados.nome,
      pontos: dados.pontos,
      fotoUrl: dados.fotoChave
        ? await gerarUrlAssinadaPerfil(dados.fotoChave)
        : (dados.image ?? null),
    })),
  );

  return linhas.sort((a, b) => b.pontos - a.pontos);
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
      desafiosSurpresa: {
        orderBy: { criadoEm: "desc" },
        include: {
          participacoes: {
            where: { clienteId: session.user.id },
          },
        },
      },
    },
  });

  if (!desafio) {
    return null;
  }

  const hoje = obterDataDeHoje();
  const { inicioSemana, fimSemana } = calcularSemanaAtual(desafio.dataInicio, hoje);

  const [marcacoesHoje, rankingSemanal, rankingGeral, jornada] = await Promise.all([
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
    prisma.jornadaDesafio.findUnique({
      where: {
        desafioId_clienteId: { desafioId: desafio.id, clienteId: session.user.id },
      },
    }),
  ]);

  const fotoAntesUrl = jornada?.fotoAntesChave
    ? await gerarUrlAssinada(jornada.fotoAntesChave)
    : null;
  const fotoDepoisUrl = jornada?.fotoDepoisChave
    ? await gerarUrlAssinada(jornada.fotoDepoisChave)
    : null;

  return {
    desafio,
    itensMarcadosHoje: new Set(marcacoesHoje.map((marcacao) => marcacao.itemId)),
    rankingSemanal,
    rankingGeral,
    clienteId: session.user.id,
    fotoAntesUrl,
    fotoDepoisUrl,
  };
}

export async function obterFluxoEncerramento() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Sessão inválida");
  }

  const desafio = await prisma.desafio.findFirst({
    where: { ativo: false },
    orderBy: { criadoEm: "desc" },
  });

  if (!desafio) {
    return null;
  }

  const clienteId = session.user.id;

  const [jornada, rankingGeral] = await Promise.all([
    prisma.jornadaDesafio.findUnique({
      where: { desafioId_clienteId: { desafioId: desafio.id, clienteId } },
    }),
    calcularRanking(desafio.id),
  ]);

  const fotoAntesUrl = jornada?.fotoAntesChave
    ? await gerarUrlAssinada(jornada.fotoAntesChave)
    : null;
  const fotoDepoisUrl = jornada?.fotoDepoisChave
    ? await gerarUrlAssinada(jornada.fotoDepoisChave)
    : null;

  return {
    desafio,
    clienteId,
    avisoVisto: jornada?.avisoEncerramentoVisto ?? false,
    reflexaoMudou: jornada?.reflexaoMudou ?? null,
    reflexaoOrgulho: jornada?.reflexaoOrgulho ?? null,
    reflexaoContinuar: jornada?.reflexaoContinuar ?? null,
    fotoAntesUrl,
    fotoDepoisUrl,
    rankingGeral,
  };
}
