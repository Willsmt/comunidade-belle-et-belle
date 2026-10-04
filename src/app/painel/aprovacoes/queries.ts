import { requererAcessoPainelOuRedirecionar } from "@/lib/auth/requerer-acesso-painel";
import { prisma } from "@/lib/prisma";
import { gerarUrlAssinada as gerarUrlAssinadaItem } from "@/lib/storage/comprovantes-item-desafio";
import { gerarUrlAssinada as gerarUrlAssinadaSurpresa } from "@/lib/storage/comprovantes-surpresa";

export async function listarPendentes() {
  await requererAcessoPainelOuRedirecionar();

  return prisma.user.findMany({
    where: { status: "PENDENTE" },
    orderBy: { criadoEm: "asc" },
    select: { id: true, name: true, email: true, image: true, criadoEm: true },
  });
}

export async function listarComprovacoesPendentes() {
  await requererAcessoPainelOuRedirecionar();

  const [marcacoesPendentes, participacoesPendentes] = await Promise.all([
    prisma.marcacaoItem.findMany({
      where: { validado: false },
      orderBy: { criadoEm: "asc" },
      include: {
        item: {
          select: {
            descricao: true,
            pontos: true,
            categoria: { select: { desafio: { select: { titulo: true } } } },
          },
        },
        cliente: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.participacaoSurpresa.findMany({
      where: { validado: false },
      orderBy: { criadoEm: "asc" },
      include: {
        desafioSurpresa: { select: { titulo: true, pontos: true } },
        cliente: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  const itens = await Promise.all(
    marcacoesPendentes.map(async (marcacao) => ({
      ...marcacao,
      fotoUrl: marcacao.fotoChave ? await gerarUrlAssinadaItem(marcacao.fotoChave) : null,
    })),
  );

  const participacoesSurpresa = await Promise.all(
    participacoesPendentes.map(async (participacao) => ({
      ...participacao,
      fotoUrl: participacao.fotoChave
        ? await gerarUrlAssinadaSurpresa(participacao.fotoChave)
        : null,
    })),
  );

  return { itens, participacoesSurpresa };
}
