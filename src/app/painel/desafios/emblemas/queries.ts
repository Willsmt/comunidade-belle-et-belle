import { prisma } from "@/lib/prisma";

export function listarEmblemas() {
  return prisma.emblema.findMany({
    orderBy: { nome: "asc" },
  });
}
