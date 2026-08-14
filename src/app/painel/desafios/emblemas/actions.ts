"use server";
import { revalidatePath } from "next/cache";
import { isDriverAdapterError } from "@prisma/driver-adapter-utils";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requererAcessoPainel } from "@/lib/auth/requerer-acesso-painel";
import { ehNomeIconeEmblemaValido } from "@/lib/emblemas/icones";

// Com driver adapters (@prisma/adapter-pg), nem todo SQLSTATE de violação de
// FK vira o código conhecido P2003 — o adapter só mapeia 23503 (violação de
// FK "solta") para esse código. RESTRICT (23001, o que a constraint
// Conquista_emblemaId_fkey usa) não tem mapeamento dedicado no adapter e cai
// no fallback genérico P2039, carregando o SQLSTATE real do Postgres dentro
// de meta.driverAdapterError.cause. Checamos os dois caminhos.
function ehViolacaoRestricaoFK(erro: unknown): boolean {
  if (!(erro instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (erro.code === "P2003") return true;
  if (erro.code !== "P2039") return false;

  const driverAdapterError = erro.meta?.driverAdapterError;
  if (!isDriverAdapterError(driverAdapterError)) return false;

  const causa = driverAdapterError.cause;
  return (
    causa.kind === "postgres" && (causa.code === "23001" || causa.code === "23503")
  );
}

export async function criarEmblema(formData: FormData) {
  await requererAcessoPainel();
  const nome = formData.get("nome");
  const descricao = formData.get("descricao");
  const icone = formData.get("icone");
  if (typeof nome !== "string" || nome.trim() === "") {
    throw new Error("Informe o nome do emblema");
  }
  if (typeof icone === "string" && icone.trim() !== "" && !ehNomeIconeEmblemaValido(icone)) {
    throw new Error("Ícone inválido");
  }
  await prisma.emblema.create({
    data: {
      nome,
      descricao: typeof descricao === "string" && descricao.trim() !== "" ? descricao : null,
      icone: typeof icone === "string" && icone.trim() !== "" ? icone : null,
    },
  });
  revalidatePath("/painel/desafios/emblemas");
}

export async function removerEmblema(emblemaId: string) {
  await requererAcessoPainel();
  try {
    await prisma.emblema.delete({
      where: { id: emblemaId },
    });
  } catch (erro) {
    if (ehViolacaoRestricaoFK(erro)) {
      throw new Error(
        "Não é possível remover: esse emblema já foi concedido a alguém.",
      );
    }
    throw erro;
  }
  revalidatePath("/painel/desafios/emblemas");
}
