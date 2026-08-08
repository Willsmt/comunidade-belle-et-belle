import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gerarUrlAssinada } from "@/lib/storage/fotos";

export async function listarFotos() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Sessão inválida");
  }

  const fotos = await prisma.fotoEvolucao.findMany({
    where: { clienteId: session.user.id },
    orderBy: { data: "desc" },
  });

  return Promise.all(
    fotos.map(async (foto) => ({
      ...foto,
      urlAssinada: await gerarUrlAssinada(foto.chave),
    })),
  );
}
