import { unstable_rethrow } from "next/navigation";

// Erro intencional, escrito no código pra virar mensagem amigável na tela.
// Qualquer coisa que NÃO seja AppError (erro cru do Prisma, bug inesperado)
// é mascarada com uma mensagem genérica antes de chegar no client — o erro
// real é logado no servidor pra investigação.
export class AppError extends Error {}

export async function executarAction<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (erro) {
    // Precisa ser a primeira linha do catch (exigência da própria API do
    // Next): sinais internos de controle de fluxo (redirect, notFound,
    // permanentRedirect) são relançados aqui sem serem tratados como erro.
    unstable_rethrow(erro);

    if (erro instanceof AppError) {
      throw erro;
    }

    console.error("Erro não tratado em Server Action:", erro);
    throw new Error("Não foi possível concluir a ação.");
  }
}
