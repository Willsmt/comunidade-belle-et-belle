import { prisma } from "@/lib/prisma";

export function listarTiposSessao() {
  return prisma.tipoSessao.findMany({
    orderBy: { nome: "asc" },
  });
}

export function listarTiposPacote() {
  return prisma.tipoPacote.findMany({
    orderBy: { criadoEm: "desc" },
    include: {
      itens: {
        include: { tipoSessao: true },
      },
    },
  });
}
