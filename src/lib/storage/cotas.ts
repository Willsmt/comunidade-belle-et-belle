import { AppError } from "@/lib/actions/executar-action";
import { prisma } from "@/lib/prisma";

export const LIMITE_FOTOS_EVOLUCAO_POR_CLIENTE = 100;
export const LIMITE_POSTS_COM_IMAGEM_POR_JANELA = 10;
export const LIMITE_PLANOS_POR_JANELA = 5;
export const JANELA_COTA_MS = 24 * 60 * 60 * 1000;

function inicioDaJanela(agora: Date): Date {
  return new Date(agora.getTime() - JANELA_COTA_MS);
}

export async function garantirCotaFotosEvolucao(
  clienteId: string,
): Promise<void> {
  const total = await prisma.fotoEvolucao.count({ where: { clienteId } });
  if (total >= LIMITE_FOTOS_EVOLUCAO_POR_CLIENTE) {
    throw new AppError(
      `Você atingiu o limite de ${LIMITE_FOTOS_EVOLUCAO_POR_CLIENTE} fotos. Exclua fotos antigas para enviar novas.`,
    );
  }
}

// Post com foto de evolução reaproveita o objeto existente e não faz upload,
// por isso só conta post com imagemChave e fotoEvolucaoId nulo.
export async function garantirCotaPostsComImagem(
  autorId: string,
  agora: Date = new Date(),
): Promise<void> {
  const total = await prisma.post.count({
    where: {
      autorId,
      imagemChave: { not: null },
      fotoEvolucaoId: null,
      criadoEm: { gte: inicioDaJanela(agora) },
    },
  });
  if (total >= LIMITE_POSTS_COM_IMAGEM_POR_JANELA) {
    throw new AppError(
      `Você atingiu o limite de ${LIMITE_POSTS_COM_IMAGEM_POR_JANELA} posts com imagem nas últimas 24 horas. Tente novamente mais tarde.`,
    );
  }
}

export async function garantirCotaPlanos(
  parceriaId: string,
  agora: Date = new Date(),
): Promise<void> {
  const total = await prisma.planoRecebido.count({
    where: { parceriaId, enviadoEm: { gte: inicioDaJanela(agora) } },
  });
  if (total >= LIMITE_PLANOS_POR_JANELA) {
    throw new AppError(
      `Você atingiu o limite de ${LIMITE_PLANOS_POR_JANELA} planos enviados nas últimas 24 horas. Tente novamente mais tarde.`,
    );
  }
}
