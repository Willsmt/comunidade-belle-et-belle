import { requererAcessoPainelOuRedirecionar } from "@/lib/auth/requerer-acesso-painel";
import { prisma } from "@/lib/prisma";

export async function listarTiposSessao() {
  await requererAcessoPainelOuRedirecionar();

  return prisma.tipoSessao.findMany({
    orderBy: { nome: "asc" },
  });
}

export async function listarTiposPacote() {
  await requererAcessoPainelOuRedirecionar();

  return prisma.tipoPacote.findMany({
    orderBy: { criadoEm: "desc" },
    include: {
      itens: {
        include: { tipoSessao: true },
      },
    },
  });
}
