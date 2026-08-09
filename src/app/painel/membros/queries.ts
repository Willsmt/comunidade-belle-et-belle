import { prisma } from "@/lib/prisma";

export function listarMembros() {
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
