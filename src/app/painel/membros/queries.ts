import { requererAcessoPainelOuRedirecionar } from "@/lib/auth/requerer-acesso-painel";
import { prisma } from "@/lib/prisma";

export async function contarAdminsGestorasAtivos() {
  await requererAcessoPainelOuRedirecionar();

  return prisma.user.count({
    where: {
      status: "ATIVO",
      papeis: { some: { papel: { in: ["ADMIN", "GESTORA"] } } },
    },
  });
}

export async function listarMembros() {
  await requererAcessoPainelOuRedirecionar();

  return prisma.user.findMany({
    where: { status: { in: ["ATIVO", "SUSPENSO"] } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      status: true,
      papeis: { select: { papel: true } },
      _count: {
        select: {
          vinculosComoParceria: { where: { ativo: true } },
        },
      },
    },
  });
}
