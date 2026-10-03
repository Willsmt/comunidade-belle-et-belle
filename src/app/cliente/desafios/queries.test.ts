import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAuth,
  mockFindFirst,
  mockFindMany,
  mockParticipacaoFindMany,
  mockJornadaFindUnique,
  mockGerarUrlAssinada,
  mockGerarUrlAssinadaPerfil,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockFindFirst: vi.fn(),
  mockFindMany: vi.fn(),
  mockParticipacaoFindMany: vi.fn(),
  mockJornadaFindUnique: vi.fn(),
  mockGerarUrlAssinada: vi.fn(),
  mockGerarUrlAssinadaPerfil: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: mockAuth,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    desafio: { findFirst: mockFindFirst },
    marcacaoItem: { findMany: mockFindMany },
    participacaoSurpresa: { findMany: mockParticipacaoFindMany },
    jornadaDesafio: { findUnique: mockJornadaFindUnique },
  },
}));
vi.mock("@/lib/storage/jornada-desafio", () => ({
  gerarUrlAssinada: mockGerarUrlAssinada,
}));
vi.mock("@/lib/storage/perfil", () => ({
  gerarUrlAssinadaCacheavel: mockGerarUrlAssinadaPerfil,
}));

import { obterDesafioAtivoParaCliente, obterFluxoEncerramento } from "./queries";

describe("obterDesafioAtivoParaCliente", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockFindFirst.mockReset();
    mockFindMany.mockReset();
    mockParticipacaoFindMany.mockReset();
    mockParticipacaoFindMany.mockResolvedValue([]);
    mockJornadaFindUnique.mockReset();
    mockGerarUrlAssinada.mockReset();
    mockGerarUrlAssinadaPerfil.mockReset();
  });

  it("exige sessão válida", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(obterDesafioAtivoParaCliente()).rejects.toThrow("Sessão inválida");
    expect(mockFindFirst).not.toHaveBeenCalled();
  });

  it("retorna null quando não há desafio ativo", async () => {
    mockAuth.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindFirst.mockResolvedValue(null);

    const resultado = await obterDesafioAtivoParaCliente();

    expect(resultado).toBeNull();
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("busca o desafio ativo com categorias/itens, desafios surpresa e a jornada do cliente", async () => {
    mockAuth.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindFirst.mockResolvedValue({
      id: "d1",
      categorias: [],
      dataInicio: new Date("2026-08-01T00:00:00.000Z"),
    });
    mockFindMany
      .mockResolvedValueOnce([{ itemId: "i1" }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    mockJornadaFindUnique.mockResolvedValue(null);

    const resultado = await obterDesafioAtivoParaCliente();

    expect(mockJornadaFindUnique).toHaveBeenCalledWith({
      where: { desafioId_clienteId: { desafioId: "d1", clienteId: "cliente-1" } },
    });
    expect(resultado?.fotoAntesUrl).toBeNull();
    expect(resultado?.fotoDepoisUrl).toBeNull();
    expect(mockGerarUrlAssinada).not.toHaveBeenCalled();
  });

  it("gera signed URL das fotos quando a jornada já tem chaves salvas", async () => {
    mockAuth.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindFirst.mockResolvedValue({
      id: "d1",
      categorias: [],
      dataInicio: new Date("2026-08-01T00:00:00.000Z"),
    });
    mockFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    mockJornadaFindUnique.mockResolvedValue({
      fotoAntesChave: "jornada-desafio/cliente-1/antes.webp",
      fotoDepoisChave: "jornada-desafio/cliente-1/depois.webp",
    });
    mockGerarUrlAssinada
      .mockResolvedValueOnce("https://url-antes.exemplo")
      .mockResolvedValueOnce("https://url-depois.exemplo");

    const resultado = await obterDesafioAtivoParaCliente();

    expect(resultado?.fotoAntesUrl).toBe("https://url-antes.exemplo");
    expect(resultado?.fotoDepoisUrl).toBe("https://url-depois.exemplo");
  });

  it("soma os pontos por cliente e ordena o ranking do maior pro menor", async () => {
    mockAuth.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindFirst.mockResolvedValue({
      id: "d1",
      categorias: [],
      dataInicio: new Date("2026-08-01T00:00:00.000Z"),
    });
    const marcacoesComPontos = [
      {
        clienteId: "cliente-1",
        item: { pontos: 5 },
        cliente: { id: "cliente-1", name: "Você", email: "voce@x.com" },
      },
      {
        clienteId: "cliente-2",
        item: { pontos: 10 },
        cliente: { id: "cliente-2", name: "Marina", email: "marina@x.com" },
      },
      {
        clienteId: "cliente-1",
        item: { pontos: 3 },
        cliente: { id: "cliente-1", name: "Você", email: "voce@x.com" },
      },
    ];
    mockFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(marcacoesComPontos)
      .mockResolvedValueOnce(marcacoesComPontos);
    mockJornadaFindUnique.mockResolvedValue(null);

    const resultado = await obterDesafioAtivoParaCliente();

    expect(resultado?.rankingSemanal).toEqual([
      { clienteId: "cliente-2", nome: "Marina", pontos: 10, fotoUrl: null },
      { clienteId: "cliente-1", nome: "Você", pontos: 8, fotoUrl: null },
    ]);
  });

  it("no ranking, usa a foto de perfil própria quando o cliente tem fotoChave", async () => {
    mockAuth.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindFirst.mockResolvedValue({
      id: "d1",
      categorias: [],
      dataInicio: new Date("2026-08-01T00:00:00.000Z"),
    });
    mockFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          clienteId: "cliente-2",
          item: { pontos: 10 },
          cliente: {
            id: "cliente-2",
            name: "Marina",
            email: "marina@x.com",
            image: "https://google.exemplo/foto.jpg",
            perfil: { fotoChave: "perfis-cliente/cliente-2/foto.webp" },
          },
        },
      ])
      .mockResolvedValueOnce([]);
    mockJornadaFindUnique.mockResolvedValue(null);
    mockGerarUrlAssinadaPerfil.mockResolvedValue("https://url-assinada-propria.exemplo");

    const resultado = await obterDesafioAtivoParaCliente();

    expect(mockGerarUrlAssinadaPerfil).toHaveBeenCalledWith(
      "perfis-cliente/cliente-2/foto.webp",
    );
    expect(resultado?.rankingSemanal[0]?.fotoUrl).toBe(
      "https://url-assinada-propria.exemplo",
    );
  });

  it("no ranking, cai pro image do Google quando o cliente não tem fotoChave", async () => {
    mockAuth.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindFirst.mockResolvedValue({
      id: "d1",
      categorias: [],
      dataInicio: new Date("2026-08-01T00:00:00.000Z"),
    });
    mockFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          clienteId: "cliente-2",
          item: { pontos: 10 },
          cliente: {
            id: "cliente-2",
            name: "Marina",
            email: "marina@x.com",
            image: "https://google.exemplo/foto.jpg",
            perfil: null,
          },
        },
      ])
      .mockResolvedValueOnce([]);
    mockJornadaFindUnique.mockResolvedValue(null);

    const resultado = await obterDesafioAtivoParaCliente();

    expect(mockGerarUrlAssinadaPerfil).not.toHaveBeenCalled();
    expect(resultado?.rankingSemanal[0]?.fotoUrl).toBe(
      "https://google.exemplo/foto.jpg",
    );
  });

  it("filtra MarcacaoItem por validado: true ao calcular o ranking", async () => {
    mockAuth.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindFirst.mockResolvedValue({
      id: "d1",
      categorias: [],
      dataInicio: new Date("2026-08-01T00:00:00.000Z"),
    });
    mockFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    mockJornadaFindUnique.mockResolvedValue(null);

    await obterDesafioAtivoParaCliente();

    expect(mockFindMany).toHaveBeenNthCalledWith(2, {
      where: {
        validado: true,
        item: { categoria: { desafioId: "d1" } },
        data: { gte: expect.any(Date), lte: expect.any(Date) },
      },
      orderBy: { id: "asc" },
      include: { item: { select: { pontos: true } }, cliente: { select: expect.any(Object) } },
    });
    expect(mockFindMany).toHaveBeenNthCalledWith(3, {
      where: { validado: true, item: { categoria: { desafioId: "d1" } } },
      orderBy: { id: "asc" },
      include: { item: { select: { pontos: true } }, cliente: { select: expect.any(Object) } },
    });
  });

  it("itensMarcadosHoje traz o validado de cada marcação (pendente e aprovada)", async () => {
    mockAuth.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindFirst.mockResolvedValue({
      id: "d1",
      categorias: [],
      dataInicio: new Date("2026-08-01T00:00:00.000Z"),
    });
    mockFindMany
      .mockResolvedValueOnce([
        { itemId: "i1", validado: false },
        { itemId: "i2", validado: true },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    mockJornadaFindUnique.mockResolvedValue(null);

    const resultado = await obterDesafioAtivoParaCliente();

    expect(resultado?.itensMarcadosHoje.get("i1")).toEqual({ validado: false });
    expect(resultado?.itensMarcadosHoje.get("i2")).toEqual({ validado: true });
  });

  it("US4 (não regressão): soma na hora um item sem exigeFoto, e a mesma consulta já exclui itens pendentes por construção", async () => {
    mockAuth.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindFirst.mockResolvedValue({
      id: "d1",
      categorias: [],
      dataInicio: new Date("2026-08-01T00:00:00.000Z"),
    });
    // O mock simula o que o Postgres real devolveria depois de aplicar
    // `where: { validado: true }` — só a marcação do item sem exigeFoto
    // (que nasce validado: true) aparece aqui; uma marcação pendente de
    // outro item nunca chegaria a este array (asserção do filtro em cima).
    mockFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          clienteId: "cliente-1",
          item: { pontos: 10 },
          cliente: { id: "cliente-1", name: "Você", email: "voce@x.com" },
        },
      ])
      .mockResolvedValueOnce([]);
    mockJornadaFindUnique.mockResolvedValue(null);

    const resultado = await obterDesafioAtivoParaCliente();

    expect(mockFindMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ where: expect.objectContaining({ validado: true }) }),
    );
    expect(resultado?.rankingSemanal).toEqual([
      { clienteId: "cliente-1", nome: "Você", pontos: 10, fotoUrl: null },
    ]);
  });

  it("soma os pontos de participações surpresa aprovadas no ranking geral, mas não no semanal", async () => {
    mockAuth.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindFirst.mockResolvedValue({
      id: "d1",
      categorias: [],
      dataInicio: new Date("2026-08-01T00:00:00.000Z"),
    });
    mockFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    mockParticipacaoFindMany.mockResolvedValue([
      {
        clienteId: "cliente-2",
        desafioSurpresa: { pontos: 50 },
        cliente: { id: "cliente-2", name: "Marina", email: "marina@x.com" },
      },
    ]);
    mockJornadaFindUnique.mockResolvedValue(null);

    const resultado = await obterDesafioAtivoParaCliente();

    expect(mockParticipacaoFindMany).toHaveBeenCalledTimes(1);
    expect(mockParticipacaoFindMany).toHaveBeenCalledWith({
      where: { validado: true, desafioSurpresa: { desafioId: "d1" } },
      include: {
        desafioSurpresa: { select: { pontos: true } },
        cliente: { select: expect.any(Object) },
      },
    });
    expect(resultado?.rankingSemanal).toEqual([]);
    expect(resultado?.rankingGeral).toEqual([
      { clienteId: "cliente-2", nome: "Marina", pontos: 50, fotoUrl: null },
    ]);
  });
});

describe("obterFluxoEncerramento", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockFindFirst.mockReset();
    mockFindMany.mockReset();
    mockParticipacaoFindMany.mockReset();
    mockParticipacaoFindMany.mockResolvedValue([]);
    mockJornadaFindUnique.mockReset();
    mockGerarUrlAssinada.mockReset();
    mockGerarUrlAssinadaPerfil.mockReset();
  });

  it("exige sessão válida", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(obterFluxoEncerramento()).rejects.toThrow("Sessão inválida");
  });

  it("retorna null quando não há nenhum desafio encerrado", async () => {
    mockAuth.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindFirst.mockResolvedValue(null);

    const resultado = await obterFluxoEncerramento();

    expect(resultado).toBeNull();
  });

  it("busca o desafio encerrado mais recente com o ranking geral e a jornada do cliente", async () => {
    mockAuth.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindFirst.mockResolvedValue({ id: "d1", titulo: "Glow Up" });
    mockFindMany.mockResolvedValue([]);
    mockJornadaFindUnique.mockResolvedValue(null);

    const resultado = await obterFluxoEncerramento();

    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { ativo: false },
      orderBy: [{ criadoEm: "desc" }, { id: "desc" }],
    });
    expect(mockJornadaFindUnique).toHaveBeenCalledWith({
      where: { desafioId_clienteId: { desafioId: "d1", clienteId: "cliente-1" } },
    });
    expect(resultado?.avisoVisto).toBe(false);
    expect(resultado?.fotoAntesUrl).toBeNull();
    expect(resultado?.fotoDepoisUrl).toBeNull();
  });

  it("retorna os dados salvos da jornada quando já existem", async () => {
    mockAuth.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindFirst.mockResolvedValue({ id: "d1", titulo: "Glow Up" });
    mockFindMany.mockResolvedValue([]);
    mockJornadaFindUnique.mockResolvedValue({
      avisoEncerramentoVisto: true,
      reflexaoMudou: "Tudo",
      reflexaoOrgulho: "Disciplina",
      reflexaoContinuar: "Água",
      fotoAntesChave: "jornada-desafio/cliente-1/antes.webp",
      fotoDepoisChave: "jornada-desafio/cliente-1/depois.webp",
    });
    mockGerarUrlAssinada
      .mockResolvedValueOnce("https://url-antes.exemplo")
      .mockResolvedValueOnce("https://url-depois.exemplo");

    const resultado = await obterFluxoEncerramento();

    expect(resultado?.avisoVisto).toBe(true);
    expect(resultado?.reflexaoMudou).toBe("Tudo");
    expect(resultado?.fotoAntesUrl).toBe("https://url-antes.exemplo");
    expect(resultado?.fotoDepoisUrl).toBe("https://url-depois.exemplo");
  });

  it("soma os pontos de participações surpresa aprovadas no ranking geral final", async () => {
    mockAuth.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindFirst.mockResolvedValue({ id: "d1", titulo: "Glow Up" });
    mockFindMany.mockResolvedValue([]);
    mockParticipacaoFindMany.mockResolvedValue([
      {
        clienteId: "cliente-1",
        desafioSurpresa: { pontos: 50 },
        cliente: { id: "cliente-1", name: "Você", email: "voce@x.com" },
      },
    ]);
    mockJornadaFindUnique.mockResolvedValue(null);

    const resultado = await obterFluxoEncerramento();

    expect(resultado?.rankingGeral).toEqual([
      { clienteId: "cliente-1", nome: "Você", pontos: 50, fotoUrl: null },
    ]);
  });
});
