import { requererAcessoPainelOuRedirecionar } from "@/lib/auth/requerer-acesso-painel";
import { prisma } from "@/lib/prisma";

export async function listarEmblemas() {
  await requererAcessoPainelOuRedirecionar();

  return prisma.emblema.findMany({
    orderBy: { nome: "asc" },
  });
}
