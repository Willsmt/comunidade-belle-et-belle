import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAuth,
  mockFindUniqueUser,
  mockFindFirstMedida,
  mockFindManyConquista,
  mockFindManyFoto,
  mockFindManyPost,
  mockGerarUrlAssinada,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockFindUniqueUser: vi.fn(),
  mockFindFirstMedida: vi.fn(),
  mockFindManyConquista: vi.fn(),
  mockFindManyFoto: vi.fn(),
  mockFindManyPost: vi.fn(),
  mockGerarUrlAssinada: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: mockFindUniqueUser },
    registroMedida: { findFirst: mockFindFirstMedida },
    conquista: { findMany: mockFindManyConquista },
    fotoEvolucao: { findMany: mockFindManyFoto },
    post: { findMany: mockFindManyPost },
  },
}));
vi.mock("@/lib/storage/fotos", () => ({
  gerarUrlAssinada: mockGerarUrlAssinada,
}));

import { obterPerfilPublico } from "./queries";

describe("obterPerfilPublico", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockFindUniqueUser.mockReset();
    mockFindFirstMedida.mockReset();
    mockFindManyConquista.mockReset().mockResolvedValue([]);
    mockFindManyFoto.mockReset().mockResolvedValue([]);
    mockFindManyPost.mockReset().mockResolvedValue([]);
    mockGerarUrlAssinada.mockReset();
  });

  it("lança erro se não houver sessão", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(obterPerfilPublico("cliente-1")).rejects.toThrow(
      "Sessão inválida",
    );
  });

  it("retorna null se o usuário não existir", async () => {
    mockAuth.mockResolvedValue({ user: { id: "viewer-1" } });
    mockFindUniqueUser.mockResolvedValue(null);

    const resultado = await obterPerfilPublico("nao-existe");

    expect(resultado).toBeNull();
    expect(mockFindFirstMedida).not.toHaveBeenCalled();
  });

  it("omite bio quando bioPublica é false, mesmo com bio preenchida", async () => {
    mockAuth.mockResolvedValue({ user: { id: "viewer-1" } });
    mockFindUniqueUser.mockResolvedValue({
      name: "Cliente 1",
      perfil: {
        bio: "segredo",
        bioPublica: false,
        emblemasPublicos: true,
        medidasPublicas: false,
      },
    });

    const resultado = await obterPerfilPublico("cliente-1");

    expect(resultado?.bio).toBeNull();
    expect(mockFindFirstMedida).not.toHaveBeenCalled();
  });

  it("busca a última medida só quando medidasPublicas é true", async () => {
    mockAuth.mockResolvedValue({ user: { id: "viewer-1" } });
    mockFindUniqueUser.mockResolvedValue({
      name: "Cliente 1",
      perfil: {
        bio: null,
        bioPublica: false,
        emblemasPublicos: true,
        medidasPublicas: true,
      },
    });
    mockFindFirstMedida.mockResolvedValue({ id: "medida-1", peso: 60 });

    const resultado = await obterPerfilPublico("cliente-1");

    expect(mockFindFirstMedida).toHaveBeenCalledWith({
      where: { clienteId: "cliente-1" },
      orderBy: { data: "desc" },
    });
    expect(resultado?.ultimaMedida).toEqual({ id: "medida-1", peso: 60 });
  });

  it("busca as conquistas só quando emblemasPublicos é true, incluindo o emblema de cada uma", async () => {
    mockAuth.mockResolvedValue({ user: { id: "viewer-1" } });
    mockFindUniqueUser.mockResolvedValue({
      name: "Cliente 1",
      perfil: {
        bio: null,
        bioPublica: false,
        emblemasPublicos: true,
        medidasPublicas: false,
      },
    });
    mockFindManyConquista.mockResolvedValue([
      {
        id: "c1",
        emblema: { nome: "Campeã da Semana", icone: "🏆", descricao: "Venceu a semana" },
      },
    ]);

    const resultado = await obterPerfilPublico("cliente-1");

    expect(mockFindManyConquista).toHaveBeenCalledWith({
      where: { clienteId: "cliente-1" },
      orderBy: { criadoEm: "desc" },
      include: { emblema: true },
    });
    expect(resultado?.conquistas).toEqual([
      { id: "c1", nome: "Campeã da Semana", icone: "🏆", descricao: "Venceu a semana" },
    ]);
  });

  it("não busca conquistas quando emblemasPublicos é false", async () => {
    mockAuth.mockResolvedValue({ user: { id: "viewer-1" } });
    mockFindUniqueUser.mockResolvedValue({
      name: "Cliente 1",
      perfil: {
        bio: null,
        bioPublica: false,
        emblemasPublicos: false,
        medidasPublicas: false,
      },
    });

    const resultado = await obterPerfilPublico("cliente-1");

    expect(mockFindManyConquista).not.toHaveBeenCalled();
    expect(resultado?.conquistas).toEqual([]);
  });

  it("usuário sem Perfil ainda: retorna defaults seguros sem quebrar", async () => {
    mockAuth.mockResolvedValue({ user: { id: "viewer-1" } });
    mockFindUniqueUser.mockResolvedValue({ name: "Cliente novo", perfil: null });

    const resultado = await obterPerfilPublico("cliente-1");

    expect(resultado).toEqual({
      nome: "Cliente novo",
      bio: null,
      emblemasPublicos: false,
      conquistas: [],
      ultimaMedida: null,
      fotos: [],
      posts: [],
    });
  });

  it("busca só as fotos marcadas como públicas, com signed URL cada uma", async () => {
    mockAuth.mockResolvedValue({ user: { id: "viewer-1" } });
    mockFindUniqueUser.mockResolvedValue({ name: "Cliente 1", perfil: null });
    mockFindManyFoto.mockResolvedValue([
      { id: "foto-1", chave: "chave-1", data: new Date("2026-02-01") },
    ]);
    mockGerarUrlAssinada.mockResolvedValue("https://url-assinada.exemplo");

    const resultado = await obterPerfilPublico("cliente-1");

    expect(mockFindManyFoto).toHaveBeenCalledWith({
      where: { clienteId: "cliente-1", publica: true },
      orderBy: { data: "desc" },
    });
    expect(resultado?.fotos).toEqual([
      {
        id: "foto-1",
        data: new Date("2026-02-01"),
        urlAssinada: "https://url-assinada.exemplo",
      },
    ]);
  });

  it("busca todos os posts do autor, sem filtro de privacidade, com signed URL quando há imagem", async () => {
    mockAuth.mockResolvedValue({ user: { id: "viewer-1" } });
    mockFindUniqueUser.mockResolvedValue({ name: "Cliente 1", perfil: null });
    mockFindManyPost.mockResolvedValue([
      {
        id: "post-1",
        texto: "reflexão do dia",
        imagemChave: "posts/cliente-1/x.webp",
        criadoEm: new Date("2026-02-01"),
      },
      {
        id: "post-2",
        texto: "só texto",
        imagemChave: null,
        criadoEm: new Date("2026-01-01"),
      },
    ]);
    mockGerarUrlAssinada.mockResolvedValue("https://url-assinada.exemplo");

    const resultado = await obterPerfilPublico("cliente-1");

    expect(mockFindManyPost).toHaveBeenCalledWith({
      where: { autorId: "cliente-1" },
      orderBy: { criadoEm: "desc" },
    });
    expect(resultado?.posts).toEqual([
      {
        id: "post-1",
        texto: "reflexão do dia",
        criadoEm: new Date("2026-02-01"),
        urlImagem: "https://url-assinada.exemplo",
      },
      {
        id: "post-2",
        texto: "só texto",
        criadoEm: new Date("2026-01-01"),
        urlImagem: null,
      },
    ]);
  });
});
