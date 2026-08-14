import { describe, expect, it, vi } from "vitest";

const { mockAuth, mockDesafioFindFirst, mockJornadaFindUnique, mockConquistaFindMany } =
  vi.hoisted(() => ({
    mockAuth: vi.fn(),
    mockDesafioFindFirst: vi.fn(),
    mockJornadaFindUnique: vi.fn(),
    mockConquistaFindMany: vi.fn(),
  }));

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    desafio: { findFirst: mockDesafioFindFirst },
    jornadaDesafio: { findUnique: mockJornadaFindUnique },
    conquista: { findMany: mockConquistaFindMany },
  },
}));
const { mockGerarUrlAssinada } = vi.hoisted(() => ({ mockGerarUrlAssinada: vi.fn() }));
vi.mock("@/lib/storage/jornada-desafio", () => ({
  gerarUrlAssinada: mockGerarUrlAssinada,
}));

import { GET } from "./route";

describe("REPRO: GET real, sem mockar ImageResponse", () => {
  it("gera a imagem de verdade (sem fotos, sem conquistas) e reporta erro real se houver", async () => {
    mockAuth.mockResolvedValue({ user: { id: "cliente-1" } });
    mockDesafioFindFirst.mockResolvedValue({
      id: "d1",
      titulo: "Glow Up",
      dataInicio: new Date("2026-07-01"),
      dataFim: new Date("2026-07-30"),
      ativo: false,
    });
    mockJornadaFindUnique.mockResolvedValue(null);
    mockConquistaFindMany.mockResolvedValue([]);

    const resposta = await GET();
    console.log("status:", resposta.status, "content-type:", resposta.headers.get("content-type"));

    try {
      const buffer = await resposta.arrayBuffer();
      console.log("SUCESSO: bytes recebidos =", buffer.byteLength);
    } catch (erro) {
      console.log("ERRO REAL AO LER O STREAM:", erro);
      throw erro;
    }
  }, 30000);

  it("gera a imagem com conquistas (emblema com ícone emoji)", async () => {
    mockAuth.mockResolvedValue({ user: { id: "cliente-1" } });
    mockDesafioFindFirst.mockResolvedValue({
      id: "d1",
      titulo: "Glow Up",
      dataInicio: new Date("2026-07-01"),
      dataFim: new Date("2026-07-30"),
      ativo: false,
    });
    mockJornadaFindUnique.mockResolvedValue(null);
    mockConquistaFindMany.mockResolvedValue([
      {
        id: "c1",
        emblema: { id: "e1", nome: "Disciplina", icone: "🏆" },
      },
    ]);

    const resposta = await GET();
    console.log("status:", resposta.status);

    try {
      const buffer = await resposta.arrayBuffer();
      console.log("SUCESSO (com conquista): bytes recebidos =", buffer.byteLength);
    } catch (erro) {
      console.log("ERRO REAL (com conquista):", erro);
      throw erro;
    }
  }, 30000);

  it("gera a imagem com fotos de antes/depois (URL remota real)", async () => {
    mockAuth.mockResolvedValue({ user: { id: "cliente-1" } });
    mockDesafioFindFirst.mockResolvedValue({
      id: "d1",
      titulo: "Glow Up",
      dataInicio: new Date("2026-07-01"),
      dataFim: new Date("2026-07-30"),
      ativo: false,
    });
    mockJornadaFindUnique.mockResolvedValue({
      fotoAntesChave: "jornada-desafio/cliente-1/antes.webp",
      fotoDepoisChave: "jornada-desafio/cliente-1/depois.webp",
      reflexaoMudou: "Tudo",
      reflexaoOrgulho: "Disciplina",
      reflexaoContinuar: "Água",
    });
    mockGerarUrlAssinada.mockResolvedValue(
      "https://avatars.githubusercontent.com/u/9919?s=200",
    );
    mockConquistaFindMany.mockResolvedValue([]);

    const resposta = await GET();
    console.log("status:", resposta.status);

    try {
      const buffer = await resposta.arrayBuffer();
      console.log("SUCESSO (com fotos): bytes recebidos =", buffer.byteLength);
    } catch (erro) {
      console.log("ERRO REAL (com fotos):", erro);
      throw erro;
    }
  }, 30000);

  it("gera a imagem com foto de verdade no formato WebP (formato real gravado pelo upload)", async () => {
    mockAuth.mockResolvedValue({ user: { id: "cliente-1" } });
    mockDesafioFindFirst.mockResolvedValue({
      id: "d1",
      titulo: "Glow Up",
      dataInicio: new Date("2026-07-01"),
      dataFim: new Date("2026-07-30"),
      ativo: false,
    });
    mockJornadaFindUnique.mockResolvedValue({
      fotoAntesChave: "jornada-desafio/cliente-1/antes.webp",
      fotoDepoisChave: null,
      reflexaoMudou: "Tudo",
      reflexaoOrgulho: "Disciplina",
      reflexaoContinuar: "Água",
    });
    mockGerarUrlAssinada.mockResolvedValue("https://www.gstatic.com/webp/gallery/1.webp");
    mockConquistaFindMany.mockResolvedValue([]);

    const resposta = await GET();
    console.log("status:", resposta.status);

    try {
      const buffer = await resposta.arrayBuffer();
      console.log("SUCESSO (com foto webp): bytes recebidos =", buffer.byteLength);
    } catch (erro) {
      console.log("ERRO REAL (com foto webp):", erro);
      throw erro;
    }
  }, 30000);

  it("degrada com 'Sem foto' (sem quebrar) quando a URL da foto não retorna uma imagem válida", async () => {
    mockAuth.mockResolvedValue({ user: { id: "cliente-1" } });
    mockDesafioFindFirst.mockResolvedValue({
      id: "d1",
      titulo: "Glow Up",
      dataInicio: new Date("2026-07-01"),
      dataFim: new Date("2026-07-30"),
      ativo: false,
    });
    mockJornadaFindUnique.mockResolvedValue({
      fotoAntesChave: "jornada-desafio/cliente-1/antes.webp",
      fotoDepoisChave: "jornada-desafio/cliente-1/depois.webp",
      reflexaoMudou: "Tudo",
      reflexaoOrgulho: "Disciplina",
      reflexaoContinuar: "Água",
    });
    // Uma URL que resolve (200) mas não é uma imagem de verdade — o sharp
    // deve falhar ao decodificar, e isso não pode derrubar a resposta.
    mockGerarUrlAssinada.mockResolvedValue("https://example.com/nao-e-uma-imagem");
    mockConquistaFindMany.mockResolvedValue([]);

    const resposta = await GET();
    console.log("status:", resposta.status);

    const buffer = await resposta.arrayBuffer();
    console.log("SUCESSO (fallback gracioso): bytes recebidos =", buffer.byteLength);
    expect(resposta.status).toBe(200);
  }, 30000);

  it("degrada com 'Sem foto' (sem quebrar) quando a resposta é 200 mas não é uma imagem decodificável pelo sharp", async () => {
    mockAuth.mockResolvedValue({ user: { id: "cliente-1" } });
    mockDesafioFindFirst.mockResolvedValue({
      id: "d1",
      titulo: "Glow Up",
      dataInicio: new Date("2026-07-01"),
      dataFim: new Date("2026-07-30"),
      ativo: false,
    });
    mockJornadaFindUnique.mockResolvedValue({
      fotoAntesChave: "jornada-desafio/cliente-1/antes.webp",
      fotoDepoisChave: null,
      reflexaoMudou: "Tudo",
      reflexaoOrgulho: "Disciplina",
      reflexaoContinuar: "Água",
    });
    // 200 de verdade, mas o corpo é uma página HTML, não uma imagem — o
    // sharp deve rejeitar ao decodificar, e isso precisa ser capturado.
    mockGerarUrlAssinada.mockResolvedValue("https://example.com/");
    mockConquistaFindMany.mockResolvedValue([]);

    const resposta = await GET();
    console.log("status:", resposta.status);

    const buffer = await resposta.arrayBuffer();
    console.log("SUCESSO (falha do sharp tratada): bytes recebidos =", buffer.byteLength);
    expect(resposta.status).toBe(200);
  }, 30000);
});
