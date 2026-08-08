"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requererAcessoPainel } from "@/lib/auth/requerer-acesso-painel";

export async function criarEmblema(formData: FormData) {
  await requererAcessoPainel();

  const nome = formData.get("nome");
  const descricao = formData.get("descricao");
  const icone = formData.get("icone");

  if (typeof nome !== "string" || nome.trim() === "") {
    throw new Error("Informe o nome do emblema");
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

  await prisma.emblema.delete({
    where: { id: emblemaId },
  });

  revalidatePath("/painel/desafios/emblemas");
}
