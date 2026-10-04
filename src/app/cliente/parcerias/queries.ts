import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gerarUrlAssinadaCacheavel } from "@/lib/storage/parcerias";
import { nomeParaExibicao } from "@/lib/nome-exibicao";

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
        select: { id: true, name: true, perfilParceria: true },
      },
    },
  });
  return Promise.all(
    vinculos.map(async (vinculo) => ({
      id: vinculo.parceria.id,
      nome: nomeParaExibicao(vinculo.parceria.name),
      especialidade: vinculo.parceria.perfilParceria?.especialidade ?? null,
      bio: vinculo.parceria.perfilParceria?.bio ?? null,
      fotoUrl: vinculo.parceria.perfilParceria?.fotoChave
        ? await gerarUrlAssinadaCacheavel(vinculo.parceria.perfilParceria.fotoChave)
        : null,
    })),
  );
}
