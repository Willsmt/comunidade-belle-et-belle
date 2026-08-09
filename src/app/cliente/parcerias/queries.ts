import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gerarUrlAssinada } from "@/lib/storage/parcerias";

export async function listarParceriasVinculadas() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Sessão inválida");
  }
  const vinculos = await prisma.vinculoParceria.findMany({
    where: { clienteId: session.user.id, ativo: true },
    orderBy: { criadoEm: "asc" },
    include: {
      parceria: {
        select: { id: true, name: true, email: true, perfilParceria: true },
      },
    },
  });
  return Promise.all(
    vinculos.map(async (vinculo) => ({
      id: vinculo.parceria.id,
      nome: vinculo.parceria.name ?? vinculo.parceria.email,
      especialidade: vinculo.parceria.perfilParceria?.especialidade ?? null,
      bio: vinculo.parceria.perfilParceria?.bio ?? null,
      fotoUrl: vinculo.parceria.perfilParceria?.fotoChave
        ? await gerarUrlAssinada(vinculo.parceria.perfilParceria.fotoChave)
        : null,
    })),
  );
}
