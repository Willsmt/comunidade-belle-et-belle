import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { limparBanco } from "@/test-utils/db";
import {
  garantirCotaFotosEvolucao,
  garantirCotaPlanos,
  garantirCotaPostsComImagem,
} from "./cotas";

afterEach(async () => {
  await limparBanco();
});

const HORA_MS = 60 * 60 * 1000;

async function criarUsuario(email: string) {
  return prisma.user.create({
    data: { email, status: "ATIVO", name: email },
  });
}

describe("garantirCotaPostsComImagem (Postgres real)", () => {
  it("conta só posts com upload dentro das últimas 24h", async () => {
    const autor = await criarUsuario("autor@x.com");
    const outra = await criarUsuario("outra@x.com");
    const foto = await prisma.fotoEvolucao.create({
      data: { clienteId: autor.id, chave: "fotos/a.webp", publica: true },
    });

    // 10 posts antigos (fora da janela): não contam
    await prisma.post.createMany({
      data: Array.from({ length: 10 }, (_, i) => ({
        autorId: autor.id,
        imagemChave: `posts/antigo-${i}.webp`,
        criadoEm: new Date(Date.now() - 25 * HORA_MS),
      })),
    });
    // 10 posts com foto de evolução (sem upload): não contam
    await prisma.post.createMany({
      data: Array.from({ length: 10 }, () => ({
        autorId: autor.id,
        imagemChave: foto.chave,
        fotoEvolucaoId: foto.id,
      })),
    });
    // 10 posts só de texto: não contam
    await prisma.post.createMany({
      data: Array.from({ length: 10 }, () => ({ autorId: autor.id, texto: "oi" })),
    });
    // 10 posts de outra autora: não contam
    await prisma.post.createMany({
      data: Array.from({ length: 10 }, (_, i) => ({
        autorId: outra.id,
        imagemChave: `posts/outra-${i}.webp`,
      })),
    });

    await expect(garantirCotaPostsComImagem(autor.id)).resolves.toBeUndefined();

    // 9 recentes com upload: ainda passa
    await prisma.post.createMany({
      data: Array.from({ length: 9 }, (_, i) => ({
        autorId: autor.id,
        imagemChave: `posts/novo-${i}.webp`,
        criadoEm: new Date(Date.now() - 23 * HORA_MS),
      })),
    });
    await expect(garantirCotaPostsComImagem(autor.id)).resolves.toBeUndefined();

    // o 10º recente com upload atinge o limite
    await prisma.post.create({
      data: { autorId: autor.id, imagemChave: "posts/novo-9.webp" },
    });
    await expect(garantirCotaPostsComImagem(autor.id)).rejects.toThrow(
      "limite de 10 posts com imagem",
    );
  });
});

describe("garantirCotaFotosEvolucao (Postgres real)", () => {
  it("conta o total por cliente, sem misturar clientes", async () => {
    const cliente = await criarUsuario("cliente@x.com");
    const outra = await criarUsuario("outra@x.com");

    await prisma.fotoEvolucao.createMany({
      data: Array.from({ length: 100 }, (_, i) => ({
        clienteId: outra.id,
        chave: `fotos/outra-${i}.webp`,
      })),
    });
    await prisma.fotoEvolucao.createMany({
      data: Array.from({ length: 99 }, (_, i) => ({
        clienteId: cliente.id,
        chave: `fotos/cliente-${i}.webp`,
        criadoEm: new Date(Date.now() - 400 * 24 * HORA_MS),
      })),
    });

    // a outra cliente está no limite, a cliente (99, mesmo antigas) não
    await expect(garantirCotaFotosEvolucao(cliente.id)).resolves.toBeUndefined();
    await expect(garantirCotaFotosEvolucao(outra.id)).rejects.toThrow(
      "limite de 100 fotos",
    );

    await prisma.fotoEvolucao.create({
      data: { clienteId: cliente.id, chave: "fotos/cliente-99.webp" },
    });
    await expect(garantirCotaFotosEvolucao(cliente.id)).rejects.toThrow(
      "limite de 100 fotos",
    );
  });
});

describe("garantirCotaPlanos (Postgres real)", () => {
  it("conta só os planos da parceria na janela de 24h", async () => {
    const parceria = await criarUsuario("parceria@x.com");
    const outraParceria = await criarUsuario("outra-parceria@x.com");
    const cliente = await criarUsuario("cliente@x.com");

    const plano = (parceriaId: string, i: number, horasAtras: number) => ({
      clienteId: cliente.id,
      parceriaId,
      tipo: "TREINO" as const,
      arquivoChave: `planos/${i}.pdf`,
      enviadoEm: new Date(Date.now() - horasAtras * HORA_MS),
    });

    await prisma.planoRecebido.createMany({
      data: [
        ...Array.from({ length: 5 }, (_, i) => plano(parceria.id, i, 30)),
        ...Array.from({ length: 5 }, (_, i) => plano(outraParceria.id, i + 10, 1)),
        ...Array.from({ length: 4 }, (_, i) => plano(parceria.id, i + 20, 2)),
      ],
    });
    await expect(garantirCotaPlanos(parceria.id)).resolves.toBeUndefined();

    await prisma.planoRecebido.create({ data: plano(parceria.id, 30, 1) });
    await expect(garantirCotaPlanos(parceria.id)).rejects.toThrow(
      "limite de 5 planos",
    );
  });
});
