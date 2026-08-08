import { prisma } from "@/lib/prisma";

export function listarVinculos() {
  return prisma.vinculoParceria.findMany({
    orderBy: { criadoEm: "desc" },
    include: {
      cliente: { select: { id: true, name: true, email: true } },
      parceria: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function listarClientesEParcerias() {
  const [clientes, parcerias] = await Promise.all([
    prisma.user.findMany({
      where: { status: "ATIVO", papeis: { some: { papel: "CLIENTE" } } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
    prisma.user.findMany({
      where: { status: "ATIVO", papeis: { some: { papel: "PARCERIA" } } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  return { clientes, parcerias };
}
