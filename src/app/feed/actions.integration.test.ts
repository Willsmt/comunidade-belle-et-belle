import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { limparBanco } from "@/test-utils/db";

const {
  mockAuth,
  mockUploadImagemPost,
  mockDeletarImagemPost,
  mockGerarUrlAssinada,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockUploadImagemPost: vi.fn(),
  mockDeletarImagemPost: vi.fn(),
  mockGerarUrlAssinada: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/storage/posts", () => ({
  uploadImagemPost: mockUploadImagemPost,
  deletarImagemPost: mockDeletarImagemPost,
}));
vi.mock("@/lib/storage/objetos", () => ({
  gerarUrlAssinada: mockGerarUrlAssinada,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { criarPost, editarPost, apagarPost } from "./actions";
import { listarPosts } from "./queries";

afterEach(async () => {
  await limparBanco();
});

async function criarUsuario(email: string, name: string) {
  return prisma.user.create({ data: { email, status: "ATIVO", name } });
}

function sessaoDe(userId: string, papeis: string[] = ["CLIENTE"]) {
  return { user: { id: userId, papeis } };
}

function formDataTexto(texto: string) {
  const formData = new FormData();
  formData.set("texto", texto);
  return formData;
}

function formDataFotoEvolucao(fotoEvolucaoId: string) {
  const formData = new FormData();
  formData.set("fotoEvolucaoId", fotoEvolucaoId);
  return formData;
}

function formDataEditar(postId: string, texto: string) {
  const formData = new FormData();
  formData.set("postId", postId);
  formData.set("texto", texto);
  return formData;
}

function formDataPostId(postId: string) {
  const formData = new FormData();
  formData.set("postId", postId);
  return formData;
}

describe("criarPost (Postgres real)", () => {
  it("cria o post no banco com o autor da sessão", async () => {
    const cliente = await criarUsuario("cliente@x.com", "Cliente X");
    mockAuth.mockResolvedValue(sessaoDe(cliente.id));

    await criarPost(formDataTexto("minha reflexão de hoje"));

    const posts = await prisma.post.findMany({ where: { autorId: cliente.id } });
    expect(posts).toHaveLength(1);
    expect(posts[0].texto).toBe("minha reflexão de hoje");
    expect(posts[0].imagemChave).toBeNull();
  });

  it("reaproveita uma FotoEvolucao real da própria cliente, sem novo upload", async () => {
    const cliente = await criarUsuario("cliente@x.com", "Cliente X");
    const foto = await prisma.fotoEvolucao.create({
      data: { clienteId: cliente.id, chave: "fotos-evolucao/cliente/x.webp" },
    });
    mockAuth.mockResolvedValue(sessaoDe(cliente.id));

    await criarPost(formDataFotoEvolucao(foto.id));

    const post = await prisma.post.findFirstOrThrow({
      where: { autorId: cliente.id },
    });
    expect(post.imagemChave).toBe("fotos-evolucao/cliente/x.webp");
    expect(post.fotoEvolucaoId).toBe(foto.id);
    expect(mockUploadImagemPost).not.toHaveBeenCalled();
  });

  it("rejeita FotoEvolucao real que pertence a outra cliente", async () => {
    const cliente = await criarUsuario("cliente@x.com", "Cliente X");
    const outraCliente = await criarUsuario("outra@x.com", "Outra Cliente");
    const foto = await prisma.fotoEvolucao.create({
      data: { clienteId: outraCliente.id, chave: "fotos-evolucao/outra/x.webp" },
    });
    mockAuth.mockResolvedValue(sessaoDe(cliente.id));

    await expect(
      criarPost(formDataFotoEvolucao(foto.id)),
    ).rejects.toThrow("Foto de evolução inválida");
    expect(await prisma.post.count()).toBe(0);
  });
});

describe("editarPost (Postgres real)", () => {
  it("autor edita o próprio post no banco", async () => {
    const cliente = await criarUsuario("cliente@x.com", "Cliente X");
    const post = await prisma.post.create({
      data: { autorId: cliente.id, texto: "original" },
    });
    mockAuth.mockResolvedValue(sessaoDe(cliente.id));

    await editarPost(formDataEditar(post.id, "editado"));

    const atualizado = await prisma.post.findUniqueOrThrow({
      where: { id: post.id },
    });
    expect(atualizado.texto).toBe("editado");
  });

  it("rejeita edição por quem não é autor nem moderadora, sem alterar o banco", async () => {
    const autor = await criarUsuario("autor@x.com", "Autora");
    const outraCliente = await criarUsuario("outra@x.com", "Outra Cliente");
    const post = await prisma.post.create({
      data: { autorId: autor.id, texto: "original" },
    });
    mockAuth.mockResolvedValue(sessaoDe(outraCliente.id));

    await expect(
      editarPost(formDataEditar(post.id, "tentativa de edição")),
    ).rejects.toThrow("Acesso negado");

    const inalterado = await prisma.post.findUniqueOrThrow({
      where: { id: post.id },
    });
    expect(inalterado.texto).toBe("original");
  });
});

describe("apagarPost (Postgres real)", () => {
  it("apaga o post e cascateia likes e comentários reais", async () => {
    const autor = await criarUsuario("autor@x.com", "Autora");
    const outraCliente = await criarUsuario("outra@x.com", "Outra Cliente");
    const post = await prisma.post.create({
      data: { autorId: autor.id, texto: "post com engajamento" },
    });
    await prisma.like.create({ data: { postId: post.id, usuarioId: outraCliente.id } });
    await prisma.comentario.create({
      data: { postId: post.id, autorId: outraCliente.id, texto: "arrasou!" },
    });
    mockAuth.mockResolvedValue(sessaoDe(autor.id));

    await apagarPost(formDataPostId(post.id));

    expect(await prisma.post.findUnique({ where: { id: post.id } })).toBeNull();
    expect(await prisma.like.count({ where: { postId: post.id } })).toBe(0);
    expect(await prisma.comentario.count({ where: { postId: post.id } })).toBe(0);
  });

  it("moderadora real apaga post de outra cliente", async () => {
    const cliente = await criarUsuario("cliente@x.com", "Cliente X");
    const patty = await criarUsuario("patty@x.com", "Patty");
    const post = await prisma.post.create({
      data: { autorId: cliente.id, texto: "post da cliente" },
    });
    mockAuth.mockResolvedValue(sessaoDe(patty.id, ["GESTORA"]));

    await apagarPost(formDataPostId(post.id));

    expect(await prisma.post.findUnique({ where: { id: post.id } })).toBeNull();
  });
});

describe("listarPosts (Postgres real)", () => {
  it("lista posts mais recentes primeiro, com nome do autor", async () => {
    const cliente = await criarUsuario("cliente@x.com", "Cliente X");
    const antigo = await prisma.post.create({
      data: { autorId: cliente.id, texto: "primeiro post", criadoEm: new Date("2026-01-01") },
    });
    const recente = await prisma.post.create({
      data: {
        autorId: cliente.id,
        texto: "segundo post",
        imagemChave: "posts/cliente/x.webp",
        criadoEm: new Date("2026-02-01"),
      },
    });
    mockGerarUrlAssinada.mockResolvedValue("https://url-assinada.exemplo");

    const resultado = await listarPosts();

    expect(resultado.map((p) => p.id)).toEqual([recente.id, antigo.id]);
    expect(resultado[0].autor.name).toBe("Cliente X");
    expect(resultado[0].urlImagem).toBe("https://url-assinada.exemplo");
    expect(resultado[1].urlImagem).toBeNull();
  });
});
