import { prisma } from "@/lib/prisma";

export async function limparBanco() {
  await prisma.desafio.deleteMany();
  await prisma.emblema.deleteMany();
  await prisma.user.deleteMany();
}
