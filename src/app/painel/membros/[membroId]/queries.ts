import { prisma } from "@/lib/prisma";

export function obterMembro(clienteId: string) {
  return prisma.user.findUnique({
    where: { id: clienteId },
    select: { id: true, name: true, email: true },
  });
}

export async function obterCicloAtivo(clienteId: string) {
  const ciclo = await prisma.cicloPacote.findFirst({
    where: { clienteId, ativo: true },
    include: {
      itens: { include: { tipoSessao: true } },
      sessoes: { include: { tipoSessao: true }, orderBy: { data: "desc" } },
    },
  });

  if (!ciclo) {
    return null;
  }

  const itens = await Promise.all(
    ciclo.itens.map(async (item) => ({
      tipoSessaoId: item.tipoSessaoId,
      tipoSessaoNome: item.tipoSessao.nome,
      quantidadeContratada: item.quantidadeContratada,
      quantidadeRealizada: await prisma.sessaoRealizada.count({
        where: { cicloPacoteId: ciclo.id, tipoSessaoId: item.tipoSessaoId },
      }),
    })),
  );

  return {
    id: ciclo.id,
    nomePacote: ciclo.nomePacote,
    itens,
    sessoes: ciclo.sessoes.map((sessao) => ({
      id: sessao.id,
      tipoSessaoNome: sessao.tipoSessao.nome,
      data: sessao.data,
    })),
  };
}

export async function listarHistoricoCiclos(clienteId: string) {
  const ciclos = await prisma.cicloPacote.findMany({
    where: { clienteId },
    orderBy: { criadoEm: "desc" },
    include: {
      sessoes: { include: { tipoSessao: true }, orderBy: { data: "desc" } },
    },
  });

  return ciclos.map((ciclo) => ({
    id: ciclo.id,
    nomePacote: ciclo.nomePacote,
    ativo: ciclo.ativo,
    sessoes: ciclo.sessoes.map((sessao) => ({
      id: sessao.id,
      tipoSessaoNome: sessao.tipoSessao.nome,
      data: sessao.data,
    })),
  }));
}
