import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockFindFirstCicloPacote,
  mockFindManyCicloPacote,
  mockCountSessaoRealizada,
  mockFindUniqueUser,
} = vi.hoisted(() => ({
  mockFindFirstCicloPacote: vi.fn(),
  mockFindManyCicloPacote: vi.fn(),
  mockCountSessaoRealizada: vi.fn(),
  mockFindUniqueUser: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    cicloPacote: { findFirst: mockFindFirstCicloPacote, findMany: mockFindManyCicloPacote },
    sessaoRealizada: { count: mockCountSessaoRealizada },
    user: { findUnique: mockFindUniqueUser },
  },
}));

import { obterCicloAtivo, obterMembro, listarHistoricoCiclos } from "./queries";

describe("obterCicloAtivo", () => {
  beforeEach(() => {
    mockFindFirstCicloPacote.mockReset();
    mockCountSessaoRealizada.mockReset();
  });

  it("retorna null quando a cliente não tem ciclo ativo", async () => {
    mockFindFirstCicloPacote.mockResolvedValue(null);

    const resultado = await obterCicloAtivo("cliente-1");

    expect(resultado).toBeNull();
    expect(mockFindFirstCicloPacote).toHaveBeenCalledWith({
      where: { clienteId: "cliente-1", ativo: true },
      include: {
        itens: { include: { tipoSessao: true } },
        sessoes: { include: { tipoSessao: true }, orderBy: { data: "desc" } },
      },
    });
  });

  it("calcula a quantidade realizada por tipo a partir das sessões marcadas", async () => {
    mockFindFirstCicloPacote.mockResolvedValue({
      id: "ciclo-1",
      nomePacote: "Projeto Corpo dos Sonhos",
      itens: [
        { tipoSessaoId: "ts1", quantidadeContratada: 4, tipoSessao: { nome: "Aplicação" } },
        {
          tipoSessaoId: "ts2",
          quantidadeContratada: 4,
          tipoSessao: { nome: "Radiofrequência" },
        },
      ],
      sessoes: [
        { id: "sr1", data: new Date("2026-09-01"), tipoSessao: { nome: "Aplicação" } },
      ],
    });
    mockCountSessaoRealizada.mockImplementation(({ where }) =>
      where.tipoSessaoId === "ts1" ? 3 : 0,
    );

    const resultado = await obterCicloAtivo("cliente-1");

    expect(resultado).toEqual({
      id: "ciclo-1",
      nomePacote: "Projeto Corpo dos Sonhos",
      itens: [
        {
          tipoSessaoId: "ts1",
          tipoSessaoNome: "Aplicação",
          quantidadeContratada: 4,
          quantidadeRealizada: 3,
        },
        {
          tipoSessaoId: "ts2",
          tipoSessaoNome: "Radiofrequência",
          quantidadeContratada: 4,
          quantidadeRealizada: 0,
        },
      ],
      sessoes: [{ id: "sr1", tipoSessaoNome: "Aplicação", data: new Date("2026-09-01") }],
    });
  });
});

describe("listarHistoricoCiclos", () => {
  beforeEach(() => {
    mockFindManyCicloPacote.mockReset();
  });

  it("busca todos os ciclos da cliente, ativos e arquivados, com as sessões", async () => {
    mockFindManyCicloPacote.mockResolvedValue([
      {
        id: "ciclo-2",
        nomePacote: "Projeto Corpo dos Sonhos",
        ativo: true,
        sessoes: [
          { id: "sr2", data: new Date("2026-09-10"), tipoSessao: { nome: "Aplicação" } },
        ],
      },
      {
        id: "ciclo-1",
        nomePacote: "Projeto Corpo dos Sonhos",
        ativo: false,
        sessoes: [
          { id: "sr1", data: new Date("2026-08-01"), tipoSessao: { nome: "Ultrassom" } },
        ],
      },
    ]);

    const resultado = await listarHistoricoCiclos("cliente-1");

    expect(mockFindManyCicloPacote).toHaveBeenCalledWith({
      where: { clienteId: "cliente-1" },
      orderBy: { criadoEm: "desc" },
      include: {
        sessoes: { include: { tipoSessao: true }, orderBy: { data: "desc" } },
      },
    });
    expect(resultado).toEqual([
      {
        id: "ciclo-2",
        nomePacote: "Projeto Corpo dos Sonhos",
        ativo: true,
        sessoes: [{ id: "sr2", tipoSessaoNome: "Aplicação", data: new Date("2026-09-10") }],
      },
      {
        id: "ciclo-1",
        nomePacote: "Projeto Corpo dos Sonhos",
        ativo: false,
        sessoes: [{ id: "sr1", tipoSessaoNome: "Ultrassom", data: new Date("2026-08-01") }],
      },
    ]);
  });
});

describe("obterMembro", () => {
  beforeEach(() => {
    mockFindUniqueUser.mockReset();
  });

  it("busca o membro pelo id com os campos básicos", async () => {
    mockFindUniqueUser.mockResolvedValue({ id: "cliente-1", name: "Ana", email: "ana@x.com" });

    await obterMembro("cliente-1");

    expect(mockFindUniqueUser).toHaveBeenCalledWith({
      where: { id: "cliente-1" },
      select: { id: true, name: true, email: true },
    });
  });
});
