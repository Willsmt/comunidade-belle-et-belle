import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockFindMany,
  mockMarcacaoFindMany,
  mockParticipacaoFindMany,
  mockGerarUrlAssinadaItem,
  mockGerarUrlAssinadaSurpresa,
} = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockMarcacaoFindMany: vi.fn(),
  mockParticipacaoFindMany: vi.fn(),
  mockGerarUrlAssinadaItem: vi.fn(),
  mockGerarUrlAssinadaSurpresa: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findMany: mockFindMany },
    marcacaoItem: { findMany: mockMarcacaoFindMany },
    participacaoSurpresa: { findMany: mockParticipacaoFindMany },
  },
}));
vi.mock("@/lib/storage/comprovantes-item-desafio", () => ({
  gerarUrlAssinada: mockGerarUrlAssinadaItem,
}));
vi.mock("@/lib/storage/comprovantes-surpresa", () => ({
  gerarUrlAssinada: mockGerarUrlAssinadaSurpresa,
}));

import { listarPendentes, listarComprovacoesPendentes } from "./queries";

describe("listarPendentes", () => {
  it("busca usuários PENDENTE ordenados por criadoEm ascendente", async () => {
    mockFindMany.mockResolvedValue([]);
    await listarPendentes();

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { status: "PENDENTE" },
      orderBy: { criadoEm: "asc" },
      select: { id: true, name: true, email: true, image: true, criadoEm: true },
    });
  });
});

describe("listarComprovacoesPendentes", () => {
  beforeEach(() => {
    mockMarcacaoFindMany.mockReset();
    mockParticipacaoFindMany.mockReset();
    mockGerarUrlAssinadaItem.mockReset();
    mockGerarUrlAssinadaSurpresa.mockReset();
  });

  it("filtra MarcacaoItem e ParticipacaoSurpresa por validado: false", async () => {
    mockMarcacaoFindMany.mockResolvedValue([]);
    mockParticipacaoFindMany.mockResolvedValue([]);

    await listarComprovacoesPendentes();

    expect(mockMarcacaoFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { validado: false } }),
    );
    expect(mockParticipacaoFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { validado: false } }),
    );
  });

  it("monta fotoUrl só quando fotoChave existe, para os dois tipos", async () => {
    mockMarcacaoFindMany.mockResolvedValue([
      {
        id: "m1",
        fotoChave: "comprovantes-item/cliente-1/abc.webp",
        item: { descricao: "Academia", pontos: 10, categoria: { desafio: { titulo: "Glow Up" } } },
        cliente: { id: "cliente-1", name: "Cliente", email: "c@x.com" },
      },
      {
        id: "m2",
        fotoChave: null,
        item: { descricao: "Água", pontos: 5, categoria: { desafio: { titulo: "Glow Up" } } },
        cliente: { id: "cliente-2", name: "Cliente 2", email: "c2@x.com" },
      },
    ]);
    mockParticipacaoFindMany.mockResolvedValue([
      {
        id: "p1",
        fotoChave: "comprovantes-surpresa/cliente-1/xyz.webp",
        desafioSurpresa: { titulo: "Corrida", pontos: 50 },
        cliente: { id: "cliente-1", name: "Cliente", email: "c@x.com" },
      },
      {
        id: "p2",
        fotoChave: null,
        desafioSurpresa: { titulo: "Corrida", pontos: 50 },
        cliente: { id: "cliente-2", name: "Cliente 2", email: "c2@x.com" },
      },
    ]);
    mockGerarUrlAssinadaItem.mockResolvedValue("https://url-item.exemplo");
    mockGerarUrlAssinadaSurpresa.mockResolvedValue("https://url-surpresa.exemplo");

    const resultado = await listarComprovacoesPendentes();

    expect(mockGerarUrlAssinadaItem).toHaveBeenCalledWith(
      "comprovantes-item/cliente-1/abc.webp",
    );
    expect(resultado.itens[0]?.fotoUrl).toBe("https://url-item.exemplo");
    expect(resultado.itens[1]?.fotoUrl).toBeNull();

    expect(mockGerarUrlAssinadaSurpresa).toHaveBeenCalledWith(
      "comprovantes-surpresa/cliente-1/xyz.webp",
    );
    expect(resultado.participacoesSurpresa[0]?.fotoUrl).toBe("https://url-surpresa.exemplo");
    expect(resultado.participacoesSurpresa[1]?.fotoUrl).toBeNull();
  });
});
