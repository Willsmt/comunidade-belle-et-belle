import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { limparBanco } from "@/test-utils/db";

const { mockAuth, mockGerarUrlAssinada, mockGerarUrlAssinadaPerfil } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGerarUrlAssinada: vi.fn(),
  mockGerarUrlAssinadaPerfil: vi.fn(),
}));
vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/storage/fotos", () => ({
  gerarUrlAssinada: mockGerarUrlAssinada,
}));
vi.mock("@/lib/storage/perfil", () => ({
  gerarUrlAssinada: mockGerarUrlAssinadaPerfil,
}));

import { obterPerfilPublico } from "./queries";

afterEach(async () => {
  await limparBanco();
  mockGerarUrlAssinada.mockReset();
  mockGerarUrlAssinadaPerfil.mockReset();
});

describe("obterPerfilPublico (Postgres real)", () => {
  it("respeita o toggle de privacidade de medidas ponta a ponta", async () => {
    const viewer = await prisma.user.create({
      data: { email: "viewer@example.com", status: "ATIVO", name: "Viewer" },
    });
    const cliente = await prisma.user.create({
      data: { email: "cliente@example.com", status: "ATIVO", name: "Cliente" },
    });
    await prisma.perfil.create({
      data: { userId: cliente.id, bio: "oi", bioPublica: true, medidasPublicas: false },
    });
    await prisma.registroMedida.create({
      data: { clienteId: cliente.id, peso: 60 },
    });

    mockAuth.mockResolvedValue({ user: { id: viewer.id } });

    const resultado = await obterPerfilPublico(cliente.id);

    expect(resultado?.bio).toBe("oi");
    expect(resultado?.ultimaMedida).toBeNull();
  });

  it("mostra a medida mais recente quando medidasPublicas é true", async () => {
    const viewer = await prisma.user.create({
      data: { email: "viewer2@example.com", status: "ATIVO", name: "Viewer" },
    });
    const cliente = await prisma.user.create({
      data: { email: "cliente2@example.com", status: "ATIVO", name: "Cliente 2" },
    });
    await prisma.perfil.create({
      data: { userId: cliente.id, medidasPublicas: true },
    });
    await prisma.registroMedida.create({
      data: { clienteId: cliente.id, peso: 65, data: new Date("2026-01-01") },
    });
    const recente = await prisma.registroMedida.create({
      data: { clienteId: cliente.id, peso: 62, data: new Date("2026-02-01") },
    });

    mockAuth.mockResolvedValue({ user: { id: viewer.id } });

    const resultado = await obterPerfilPublico(cliente.id);

    expect(resultado?.ultimaMedida?.id).toBe(recente.id);
  });

  it("mostra só as fotos marcadas como públicas, ignorando as privadas", async () => {
    const viewer = await prisma.user.create({
      data: { email: "viewer3@example.com", status: "ATIVO", name: "Viewer" },
    });
    const cliente = await prisma.user.create({
      data: { email: "cliente3@example.com", status: "ATIVO", name: "Cliente 3" },
    });
    const fotoPublica = await prisma.fotoEvolucao.create({
      data: { clienteId: cliente.id, chave: "chave-publica", publica: true },
    });
    await prisma.fotoEvolucao.create({
      data: { clienteId: cliente.id, chave: "chave-privada", publica: false },
    });

    mockAuth.mockResolvedValue({ user: { id: viewer.id } });
    mockGerarUrlAssinada.mockResolvedValue("https://url-assinada.exemplo");

    const resultado = await obterPerfilPublico(cliente.id);

    expect(resultado?.fotos).toHaveLength(1);
    expect(resultado?.fotos[0]?.id).toBe(fotoPublica.id);
  });
});

describe("obterPerfilPublico — foto de perfil (Postgres real)", () => {
  it("usa a foto própria quando o Perfil tem fotoChave", async () => {
    const viewer = await prisma.user.create({
      data: { email: "viewer7@example.com", status: "ATIVO", name: "Viewer" },
    });
    const cliente = await prisma.user.create({
      data: {
        email: "cliente7@example.com",
        status: "ATIVO",
        name: "Cliente 7",
        image: "https://google.exemplo/foto.jpg",
      },
    });
    await prisma.perfil.create({
      data: { userId: cliente.id, fotoChave: "perfis-cliente/cliente7/foto.webp" },
    });

    mockAuth.mockResolvedValue({ user: { id: viewer.id } });
    mockGerarUrlAssinadaPerfil.mockResolvedValue("https://url-assinada-propria.exemplo");

    const resultado = await obterPerfilPublico(cliente.id);

    expect(mockGerarUrlAssinadaPerfil).toHaveBeenCalledWith(
      "perfis-cliente/cliente7/foto.webp",
    );
    expect(resultado?.fotoUrl).toBe("https://url-assinada-propria.exemplo");
  });

  it("cai pro image do Google quando não há foto própria", async () => {
    const viewer = await prisma.user.create({
      data: { email: "viewer8@example.com", status: "ATIVO", name: "Viewer" },
    });
    const cliente = await prisma.user.create({
      data: {
        email: "cliente8@example.com",
        status: "ATIVO",
        name: "Cliente 8",
        image: "https://google.exemplo/foto.jpg",
      },
    });

    mockAuth.mockResolvedValue({ user: { id: viewer.id } });

    const resultado = await obterPerfilPublico(cliente.id);

    expect(mockGerarUrlAssinadaPerfil).not.toHaveBeenCalled();
    expect(resultado?.fotoUrl).toBe("https://google.exemplo/foto.jpg");
  });
});

describe("obterPerfilPublico — posts (Postgres real)", () => {
  it("mostra todos os posts do autor, sem filtro de privacidade", async () => {
    const viewer = await prisma.user.create({
      data: { email: "viewer6@example.com", status: "ATIVO", name: "Viewer" },
    });
    const cliente = await prisma.user.create({
      data: { email: "cliente6@example.com", status: "ATIVO", name: "Cliente 6" },
    });
    const postComImagem = await prisma.post.create({
      data: {
        autorId: cliente.id,
        texto: "com foto",
        imagemChave: "posts/cliente6/x.webp",
        criadoEm: new Date("2026-02-01"),
      },
    });
    const postSoTexto = await prisma.post.create({
      data: {
        autorId: cliente.id,
        texto: "só reflexão",
        criadoEm: new Date("2026-01-01"),
      },
    });

    mockAuth.mockResolvedValue({ user: { id: viewer.id } });
    mockGerarUrlAssinada.mockResolvedValue("https://url-assinada.exemplo");

    const resultado = await obterPerfilPublico(cliente.id);

    expect(resultado?.posts.map((p) => p.id)).toEqual([
      postComImagem.id,
      postSoTexto.id,
    ]);
    expect(resultado?.posts[0]?.urlImagem).toBe("https://url-assinada.exemplo");
    expect(resultado?.posts[1]?.urlImagem).toBeNull();
  });
});

describe("obterPerfilPublico — emblemas (Postgres real)", () => {
  it("respeita o toggle de privacidade de emblemas ponta a ponta", async () => {
    const viewer = await prisma.user.create({
      data: { email: "viewer4@example.com", status: "ATIVO", name: "Viewer" },
    });
    const cliente = await prisma.user.create({
      data: { email: "cliente4@example.com", status: "ATIVO", name: "Cliente 4" },
    });
    await prisma.perfil.create({
      data: { userId: cliente.id, emblemasPublicos: false },
    });
    const desafio = await prisma.desafio.create({
      data: {
        titulo: "Glow Up",
        dataInicio: new Date("2026-08-01"),
        dataFim: new Date("2026-08-30"),
      },
    });
    const emblema = await prisma.emblema.create({ data: { nome: "Campeã da Semana" } });
    await prisma.conquista.create({
      data: {
        clienteId: cliente.id,
        desafioId: desafio.id,
        emblemaId: emblema.id,
        tipo: "RANKING_SEMANAL",
        referencia: "semana-0",
      },
    });

    mockAuth.mockResolvedValue({ user: { id: viewer.id } });

    const resultado = await obterPerfilPublico(cliente.id);

    expect(resultado?.conquistas).toEqual([]);
  });

  it("mostra as conquistas com o nome do emblema quando emblemasPublicos é true", async () => {
    const viewer = await prisma.user.create({
      data: { email: "viewer5@example.com", status: "ATIVO", name: "Viewer" },
    });
    const cliente = await prisma.user.create({
      data: { email: "cliente5@example.com", status: "ATIVO", name: "Cliente 5" },
    });
    await prisma.perfil.create({
      data: { userId: cliente.id, emblemasPublicos: true },
    });
    const desafio = await prisma.desafio.create({
      data: {
        titulo: "Glow Up",
        dataInicio: new Date("2026-08-01"),
        dataFim: new Date("2026-08-30"),
      },
    });
    const emblema = await prisma.emblema.create({
      data: { nome: "Campeã da Semana", icone: "🏆" },
    });
    await prisma.conquista.create({
      data: {
        clienteId: cliente.id,
        desafioId: desafio.id,
        emblemaId: emblema.id,
        tipo: "RANKING_SEMANAL",
        referencia: "semana-0",
      },
    });

    mockAuth.mockResolvedValue({ user: { id: viewer.id } });

    const resultado = await obterPerfilPublico(cliente.id);

    expect(resultado?.conquistas).toHaveLength(1);
    expect(resultado?.conquistas[0]?.nome).toBe("Campeã da Semana");
    expect(resultado?.conquistas[0]?.icone).toBe("🏆");
  });
});
