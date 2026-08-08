import { prisma } from "@/lib/prisma";

export async function limparBanco() {
  await prisma.user.deleteMany();
}
