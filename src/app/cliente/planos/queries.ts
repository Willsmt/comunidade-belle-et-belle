import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gerarUrlAssinada } from "@/lib/storage/planos";

export async function listarPlanosRecebidos() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Sessão inválida");
  }

  const planos = await prisma.planoRecebido.findMany({
    where: { clienteId: session.user.id },
    orderBy: { enviadoEm: "desc" },
    include: { parceria: { select: { id: true, name: true, email: true } } },
  });

  return Promise.all(
    planos.map(async (plano) => ({
      ...plano,
      urlAssinada: await gerarUrlAssinada(plano.arquivoChave),
    })),
  );
}
