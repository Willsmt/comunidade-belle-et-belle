"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requererAcessoPainel } from "@/lib/auth/requerer-acesso-painel";
import { AppError, executarAction } from "@/lib/actions/executar-action";

const PREFIXO_CAMPO_QUANTIDADE = "quantidade-";

function parseItensTipoPacote(formData: FormData) {
  const itens: { tipoSessaoId: string; quantidade: number }[] = [];

  for (const [chave, valor] of formData.entries()) {
    if (!chave.startsWith(PREFIXO_CAMPO_QUANTIDADE) || typeof valor !== "string") {
      continue;
    }
    if (valor.trim() === "") {
      continue;
    }

    const quantidade = Number(valor);
    if (!Number.isInteger(quantidade) || quantidade < 1) {
      throw new AppError(
        "A quantidade de cada tipo de sessão precisa ser 1 ou mais",
      );
    }

    itens.push({
      tipoSessaoId: chave.slice(PREFIXO_CAMPO_QUANTIDADE.length),
      quantidade,
    });
  }

  return itens;
}

async function parseEValidarItensTipoPacote(formData: FormData) {
  const itens = parseItensTipoPacote(formData);
  if (itens.length === 0) {
    throw new AppError("Selecione ao menos um tipo de sessão com quantidade");
  }

  const idsUnicos = new Set(itens.map((item) => item.tipoSessaoId));
  if (idsUnicos.size !== itens.length) {
    throw new AppError("Cada tipo de sessão só pode aparecer uma vez no pacote");
  }

  const tiposSessaoExistentes = await prisma.tipoSessao.count({
    where: { id: { in: [...idsUnicos] } },
  });
  if (tiposSessaoExistentes !== idsUnicos.size) {
    throw new AppError("Um dos tipos de sessão selecionados não existe mais");
  }

  return itens;
}

function parseNome(formData: FormData, campoVazioMensagem: string) {
  const nome = formData.get("nome");
  if (typeof nome !== "string" || nome.trim() === "") {
    throw new AppError(campoVazioMensagem);
  }
  return nome.trim();
}

function parseId(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || id.trim() === "") {
    throw new AppError("Identificador inválido");
  }
  return id;
}

async function tipoSessaoEstaEmUso(tipoSessaoId: string) {
  const [emItensTipoPacote, emItensCicloPacote, emSessoesRealizadas] = await Promise.all([
    prisma.itemTipoPacote.count({ where: { tipoSessaoId } }),
    prisma.itemCicloPacote.count({ where: { tipoSessaoId } }),
    prisma.sessaoRealizada.count({ where: { tipoSessaoId } }),
  ]);
  return emItensTipoPacote + emItensCicloPacote + emSessoesRealizadas > 0;
}

export async function criarTipoSessao(formData: FormData) {
  return executarAction(async () => {
    await requererAcessoPainel();

    const nome = parseNome(formData, "Informe o nome do tipo de sessão");

    try {
      await prisma.tipoSessao.create({ data: { nome } });
    } catch {
      throw new AppError("Já existe um tipo de sessão com esse nome");
    }

    revalidatePath("/painel/pacotes");
  });
}

export async function editarTipoSessao(formData: FormData) {
  return executarAction(async () => {
    await requererAcessoPainel();

    const id = parseId(formData);
    const nome = parseNome(formData, "Informe o nome do tipo de sessão");

    try {
      await prisma.tipoSessao.update({ where: { id }, data: { nome } });
    } catch {
      throw new AppError("Já existe um tipo de sessão com esse nome");
    }

    revalidatePath("/painel/pacotes");
  });
}

export async function excluirTipoSessao(id: string) {
  return executarAction(async () => {
    await requererAcessoPainel();

    if (await tipoSessaoEstaEmUso(id)) {
      await prisma.tipoSessao.update({ where: { id }, data: { ativo: false } });
    } else {
      await prisma.tipoSessao.delete({ where: { id } });
    }

    revalidatePath("/painel/pacotes");
  });
}

export async function reativarTipoSessao(id: string) {
  return executarAction(async () => {
    await requererAcessoPainel();

    await prisma.tipoSessao.update({ where: { id }, data: { ativo: true } });

    revalidatePath("/painel/pacotes");
  });
}

export async function criarTipoPacote(formData: FormData) {
  return executarAction(async () => {
    await requererAcessoPainel();

    const nome = parseNome(formData, "Informe o nome do tipo de pacote");
    const itens = await parseEValidarItensTipoPacote(formData);

    await prisma.tipoPacote.create({
      data: {
        nome,
        itens: {
          create: itens.map((item) => ({
            tipoSessaoId: item.tipoSessaoId,
            quantidade: item.quantidade,
          })),
        },
      },
    });

    revalidatePath("/painel/pacotes");
  });
}

export async function editarTipoPacote(formData: FormData) {
  return executarAction(async () => {
    await requererAcessoPainel();

    const id = parseId(formData);
    const nome = parseNome(formData, "Informe o nome do tipo de pacote");
    const itens = await parseEValidarItensTipoPacote(formData);

    const tipoPacote = await prisma.tipoPacote.findUnique({ where: { id } });
    if (!tipoPacote) {
      throw new AppError("Tipo de pacote não encontrado");
    }

    // A composição de ciclos já criados é uma cópia própria (FR-013) — trocar os
    // itens do catálogo aqui não afeta nenhum ciclo já vinculado a uma cliente.
    await prisma.$transaction([
      prisma.itemTipoPacote.deleteMany({ where: { tipoPacoteId: id } }),
      prisma.tipoPacote.update({
        where: { id },
        data: {
          nome,
          itens: {
            create: itens.map((item) => ({
              tipoSessaoId: item.tipoSessaoId,
              quantidade: item.quantidade,
            })),
          },
        },
      }),
    ]);

    revalidatePath("/painel/pacotes");
  });
}

export async function excluirTipoPacote(id: string) {
  return executarAction(async () => {
    await requererAcessoPainel();

    const emUso = await prisma.cicloPacote.count({ where: { tipoPacoteId: id } });

    if (emUso > 0) {
      await prisma.tipoPacote.update({ where: { id }, data: { ativo: false } });
    } else {
      await prisma.tipoPacote.delete({ where: { id } });
    }

    revalidatePath("/painel/pacotes");
  });
}

export async function reativarTipoPacote(id: string) {
  return executarAction(async () => {
    await requererAcessoPainel();

    await prisma.tipoPacote.update({ where: { id }, data: { ativo: true } });

    revalidatePath("/painel/pacotes");
  });
}
