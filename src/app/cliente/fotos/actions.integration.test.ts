import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { limparBanco } from "@/test-utils/db";

const { mockAuth, mockApagarObjeto } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockApagarObjeto: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/storage/fotos", () => ({ uploadFoto: vi.fn() }));
vi.mock("@/lib/storage/objetos", () => ({
  apagarObjetoEmMelhorEsforco: mockApagarObjeto,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { alternarVisibilidadeFoto, excluirFoto } from "./actions";

afterEach(async () => {
  await limparBanco();
  mockApagarObjeto.mockReset();
});

function formDataFoto(fotoId: string) {
  const formData = new FormData();
  formData.set("fotoId", fotoId);
  return formData;
}

async function cenario() {
  const cliente = await prisma.user.create({
    data: { email: "cliente@x.com", status: "ATIVO", name: "Cliente X" },
  });
  const outraPessoa = await prisma.user.create({
    data: { email: "outra@x.com", status: "ATIVO", name: "Outra" },
  });
  const foto = await prisma.fotoEvolucao.create({
    data: { clienteId: cliente.id, chave: "fotos-evolucao/c/a.webp", publica: true },
  });
  const outraFoto = await prisma.fotoEvolucao.create({
    data: { clienteId: cliente.id, chave: "fotos-evolucao/c/b.webp", publica: true },
  });
  const post1 = await prisma.post.create({
    data: { autorId: cliente.id, fotoEvolucaoId: foto.id, imagemChave: foto.chave },
  });
  const post2 = await prisma.post.create({
    data: { autorId: cliente.id, fotoEvolucaoId: foto.id, imagemChave: foto.chave },
  });
  const postOutraFoto = await prisma.post.create({
    data: {
      autorId: cliente.id,
      fotoEvolucaoId: outraFoto.id,
      imagemChave: outraFoto.chave,
    },
  });
  await prisma.like.create({ data: { postId: post1.id, usuarioId: outraPessoa.id } });
  await prisma.comentario.create({
    data: { postId: post2.id, autorId: outraPessoa.id, texto: "linda" },
  });
  mockAuth.mockResolvedValue({ user: { id: cliente.id, papeis: ["CLIENTE"] } });
  return { cliente, foto, outraFoto, post1, post2, postOutraFoto };
}

describe("alternarVisibilidadeFoto (Postgres real)", () => {
  it("pública -> privada apaga os posts da foto (com curtidas e comentários) e mantém a foto", async () => {
    const { foto, postOutraFoto } = await cenario();

    await alternarVisibilidadeFoto(formDataFoto(foto.id));

    const fotoDepois = await prisma.fotoEvolucao.findUniqueOrThrow({
      where: { id: foto.id },
    });
    expect(fotoDepois.publica).toBe(false);
    expect(await prisma.post.findMany({ select: { id: true } })).toEqual([
      { id: postOutraFoto.id },
    ]);
    expect(await prisma.like.count()).toBe(0);
    expect(await prisma.comentario.count()).toBe(0);
    expect(mockApagarObjeto).not.toHaveBeenCalled();
  });

  it("privada -> pública não apaga nada", async () => {
    const { foto } = await cenario();
    await prisma.fotoEvolucao.update({ where: { id: foto.id }, data: { publica: false } });

    await alternarVisibilidadeFoto(formDataFoto(foto.id));

    const fotoDepois = await prisma.fotoEvolucao.findUniqueOrThrow({
      where: { id: foto.id },
    });
    expect(fotoDepois.publica).toBe(true);
    expect(await prisma.post.count()).toBe(3);
  });
});

describe("excluirFoto (Postgres real)", () => {
  it("apaga os posts e a foto, preserva posts de outra foto e chama o R2", async () => {
    const { foto, outraFoto, postOutraFoto } = await cenario();
    mockApagarObjeto.mockResolvedValue(undefined);

    await excluirFoto(formDataFoto(foto.id));

    expect(await prisma.fotoEvolucao.findUnique({ where: { id: foto.id } })).toBeNull();
    expect(await prisma.fotoEvolucao.findUnique({ where: { id: outraFoto.id } })).not.toBeNull();
    expect(await prisma.post.findMany({ select: { id: true } })).toEqual([
      { id: postOutraFoto.id },
    ]);
    expect(await prisma.like.count()).toBe(0);
    expect(await prisma.comentario.count()).toBe(0);
    expect(mockApagarObjeto).toHaveBeenCalledWith(foto.chave, "excluirFoto");
  });
});
