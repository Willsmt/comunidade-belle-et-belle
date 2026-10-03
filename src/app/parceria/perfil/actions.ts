"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requererPapel } from "@/lib/auth/requerer-acesso-painel";
import { uploadFotoParceria } from "@/lib/storage/parcerias";
import { apagarObjetoEmMelhorEsforco } from "@/lib/storage/objetos";
import { executarAction } from "@/lib/actions/executar-action";

function parseTexto(formData: FormData, campo: string): string | null {
  const valor = formData.get(campo);
  return typeof valor === "string" && valor.trim() !== "" ? valor.trim() : null;
}

export async function atualizarPerfilParceria(formData: FormData) {
  return executarAction(async () => {
    const session = await requererPapel(["PARCERIA"]);

    const especialidade = parseTexto(formData, "especialidade");
    const bio = parseTexto(formData, "bio");

    const arquivo = formData.get("foto");
    let novaChave: string | undefined;

    if (arquivo instanceof File && arquivo.size > 0) {
      novaChave = await uploadFotoParceria(arquivo, session.user.id);
    }

    let perfilAtual;
    try {
      perfilAtual = await prisma.perfilParceria.findUnique({
        where: { usuarioId: session.user.id },
      });

      await prisma.perfilParceria.upsert({
        where: { usuarioId: session.user.id },
        create: {
          usuarioId: session.user.id,
          especialidade,
          bio,
          fotoChave: novaChave ?? null,
        },
        update: {
          especialidade,
          bio,
          ...(novaChave ? { fotoChave: novaChave } : {}),
        },
      });
    } catch (erro) {
      if (novaChave) {
        await apagarObjetoEmMelhorEsforco(novaChave, "atualizarPerfilParceria: falha ao gravar no banco");
      }
      throw erro;
    }

    if (novaChave && perfilAtual?.fotoChave) {
      await apagarObjetoEmMelhorEsforco(perfilAtual.fotoChave, "atualizarPerfilParceria: foto substituída");
    }

    revalidatePath("/parceria/perfil");
  });
}
