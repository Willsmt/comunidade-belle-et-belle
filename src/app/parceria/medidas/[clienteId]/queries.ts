import { prisma } from "@/lib/prisma";
import { requererPapel } from "@/lib/auth/requerer-acesso-painel";
import { AppError } from "@/lib/actions/executar-action";

export async function obterMedidasDaCliente(clienteId: string) {
  const session = await requererPapel(["PARCERIA"]);

  const vinculo = await prisma.vinculoParceria.findUnique({
    where: {
      clienteId_parceriaId: { clienteId, parceriaId: session.user.id },
    },
  });
  if (!vinculo || !vinculo.ativo) {
    throw new AppError("Cliente não vinculada a você");
  }

  const [cliente, medidas] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: clienteId },
      select: { id: true, name: true },
    }),
    prisma.registroMedida.findMany({
      where: { clienteId },
      orderBy: { data: "desc" },
    }),
  ]);

  return { cliente, medidas };
}
