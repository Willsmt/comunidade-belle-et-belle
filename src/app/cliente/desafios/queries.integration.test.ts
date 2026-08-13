import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { limparBanco } from "@/test-utils/db";
import { obterDataDeHoje } from "@/lib/hoje";

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: mockAuth,
}));

import { obterDesafioAtivoParaCliente, obterFluxoEncerramento } from "./queries";

afterEach(async () => {
  await limparBanco();
});

describe("obterDesafioAtivoParaCliente (Postgres real)", () => {
  it("retorna null quando não há desafio ativo", async () => {
    const cliente = await prisma.user.create({
      data: { email: "cliente@x.com", status: "ATIVO", name: "Cliente X" },
    });
    mockAuth.mockResolvedValue({ user: { id: cliente.id } });

    const resultado = await obterDesafioAtivoParaCliente();

    expect(resultado).toBeNull();
  });

  it("retorna o desafio ativo com as marcações de hoje do cliente", async () => {
    const cliente = await prisma.user.create({
      data: { email: "cliente@x.com", status: "ATIVO", name: "Cliente X" },
    });
    mockAuth.mockResolvedValue({ user: { id: cliente.id } });

    const desafio = await prisma.desafio.create({
      data: {
        titulo: "Glow Up",
        dataInicio: new Date("2026-09-01"),
        dataFim: new Date("2026-09-30"),
        ativo: true,
      },
    });
    const categoria = await prisma.categoriaDesafio.create({
      data: { desafioId: desafio.id, nome: "Pele", cor: "#f5c" },
    });
    const item1 = await prisma.itemDesafio.create({
      data: { categoriaId: categoria.id, descricao: "Hidratar", pontos: 5 },
    });
    await prisma.itemDesafio.create({
      data: { categoriaId: categoria.id, descricao: "Protetor solar", pontos: 3 },
    });

    await prisma.marcacaoItem.create({
      data: { itemId: item1.id, clienteId: cliente.id, data: obterDataDeHoje() },
    });

    const resultado = await obterDesafioAtivoParaCliente();

    expect(resultado?.desafio.id).toBe(desafio.id);
    expect(resultado?.itensMarcadosHoje.has(item1.id)).toBe(true);
    expect(resultado?.itensMarcadosHoje.size).toBe(1);
  });

  it("ranking geral soma todas as marcações, mas o semanal só conta a semana atual", async () => {
    const clienteA = await prisma.user.create({
      data: { email: "a@x.com", status: "ATIVO", name: "Cliente A" },
    });
    const clienteB = await prisma.user.create({
      data: { email: "b@x.com", status: "ATIVO", name: "Cliente B" },
    });
    mockAuth.mockResolvedValue({ user: { id: clienteA.id } });

    const hoje = obterDataDeHoje();
    const dataInicio = new Date(hoje);
    dataInicio.setUTCDate(dataInicio.getUTCDate() - 10);
    const dataFim = new Date(dataInicio);
    dataFim.setUTCDate(dataFim.getUTCDate() + 29);

    const desafio = await prisma.desafio.create({
      data: { titulo: "Glow Up", dataInicio, dataFim, ativo: true },
    });
    const categoria = await prisma.categoriaDesafio.create({
      data: { desafioId: desafio.id, nome: "Pele", cor: "#f5c" },
    });
    const item = await prisma.itemDesafio.create({
      data: { categoriaId: categoria.id, descricao: "Hidratar", pontos: 5 },
    });

    const diaAntigo = new Date(dataInicio);
    diaAntigo.setUTCDate(diaAntigo.getUTCDate() + 1);

    await prisma.marcacaoItem.create({
      data: { itemId: item.id, clienteId: clienteA.id, data: hoje },
    });
    await prisma.marcacaoItem.create({
      data: { itemId: item.id, clienteId: clienteA.id, data: diaAntigo },
    });
    await prisma.marcacaoItem.create({
      data: { itemId: item.id, clienteId: clienteB.id, data: hoje },
    });

    const resultado = await obterDesafioAtivoParaCliente();

    expect(resultado?.rankingGeral).toEqual([
      { clienteId: clienteA.id, nome: "Cliente A", pontos: 10, fotoUrl: null },
      { clienteId: clienteB.id, nome: "Cliente B", pontos: 5, fotoUrl: null },
    ]);
    expect(resultado?.rankingSemanal).toHaveLength(2);
    expect(resultado?.rankingSemanal).toEqual(
      expect.arrayContaining([
        { clienteId: clienteA.id, nome: "Cliente A", pontos: 5, fotoUrl: null },
        { clienteId: clienteB.id, nome: "Cliente B", pontos: 5, fotoUrl: null },
      ]),
    );
  });
});

describe("obterDesafioAtivoParaCliente — desafios surpresa (Postgres real)", () => {
  it("retorna desafios surpresa com só a participação do próprio cliente", async () => {
    const clienteA = await prisma.user.create({
      data: { email: "a@x.com", status: "ATIVO", name: "Cliente A" },
    });
    const clienteB = await prisma.user.create({
      data: { email: "b@x.com", status: "ATIVO", name: "Cliente B" },
    });
    mockAuth.mockResolvedValue({ user: { id: clienteA.id } });

    const desafio = await prisma.desafio.create({
      data: {
        titulo: "Glow Up",
        dataInicio: new Date("2026-09-01"),
        dataFim: new Date("2026-09-30"),
        ativo: true,
      },
    });
    const surpresa = await prisma.desafioSurpresa.create({
      data: { desafioId: desafio.id, titulo: "Corrida 5km", pontos: 50 },
    });
    await prisma.participacaoSurpresa.create({
      data: { desafioSurpresaId: surpresa.id, clienteId: clienteA.id },
    });
    await prisma.participacaoSurpresa.create({
      data: { desafioSurpresaId: surpresa.id, clienteId: clienteB.id },
    });

    const resultado = await obterDesafioAtivoParaCliente();

    expect(resultado?.desafio.desafiosSurpresa).toHaveLength(1);
    expect(resultado?.desafio.desafiosSurpresa[0]?.participacoes).toHaveLength(1);
    expect(resultado?.desafio.desafiosSurpresa[0]?.participacoes[0]?.clienteId).toBe(
      clienteA.id,
    );
  });

  it("soma os pontos de uma participação surpresa aprovada no ranking geral, mas não conta a rejeitada nem a pendente", async () => {
    const clienteA = await prisma.user.create({
      data: { email: "a@x.com", status: "ATIVO", name: "Cliente A" },
    });
    const clienteB = await prisma.user.create({
      data: { email: "b@x.com", status: "ATIVO", name: "Cliente B" },
    });
    mockAuth.mockResolvedValue({ user: { id: clienteA.id } });

    const desafio = await prisma.desafio.create({
      data: {
        titulo: "Glow Up",
        dataInicio: new Date("2026-09-01"),
        dataFim: new Date("2026-09-30"),
        ativo: true,
      },
    });
    const surpresa = await prisma.desafioSurpresa.create({
      data: { desafioId: desafio.id, titulo: "Corrida 5km", pontos: 50 },
    });
    await prisma.participacaoSurpresa.create({
      data: { desafioSurpresaId: surpresa.id, clienteId: clienteA.id, validado: true },
    });
    await prisma.participacaoSurpresa.create({
      data: { desafioSurpresaId: surpresa.id, clienteId: clienteB.id, validado: false },
    });

    const resultado = await obterDesafioAtivoParaCliente();

    expect(resultado?.rankingGeral).toEqual([
      { clienteId: clienteA.id, nome: "Cliente A", pontos: 50, fotoUrl: null },
    ]);
    expect(resultado?.rankingSemanal).toEqual([]);
  });
});

describe("obterFluxoEncerramento (Postgres real)", () => {
  it("retorna null quando não há nenhum desafio encerrado", async () => {
    const cliente = await prisma.user.create({
      data: { email: "cliente6@x.com", status: "ATIVO", name: "Cliente 6" },
    });
    mockAuth.mockResolvedValue({ user: { id: cliente.id } });

    const resultado = await obterFluxoEncerramento();

    expect(resultado).toBeNull();
  });

  it("retorna o ranking geral e a jornada do cliente do desafio encerrado mais recente", async () => {
    const clienteA = await prisma.user.create({
      data: { email: "a6@x.com", status: "ATIVO", name: "Cliente A" },
    });
    mockAuth.mockResolvedValue({ user: { id: clienteA.id } });

    await prisma.desafio.create({
      data: {
        titulo: "Edição antiga",
        dataInicio: new Date("2026-06-01"),
        dataFim: new Date("2026-06-30"),
        ativo: false,
      },
    });
    const desafioRecente = await prisma.desafio.create({
      data: {
        titulo: "Edição recente",
        dataInicio: new Date("2026-07-01"),
        dataFim: new Date("2026-07-30"),
        ativo: false,
      },
    });
    const categoria = await prisma.categoriaDesafio.create({
      data: { desafioId: desafioRecente.id, nome: "Pele", cor: "#f5c" },
    });
    const item = await prisma.itemDesafio.create({
      data: { categoriaId: categoria.id, descricao: "Água", pontos: 10 },
    });
    await prisma.marcacaoItem.create({
      data: { itemId: item.id, clienteId: clienteA.id, data: new Date("2026-07-05") },
    });
    await prisma.jornadaDesafio.create({
      data: {
        desafioId: desafioRecente.id,
        clienteId: clienteA.id,
        avisoEncerramentoVisto: true,
      },
    });

    const resultado = await obterFluxoEncerramento();

    expect(resultado?.desafio.id).toBe(desafioRecente.id);
    expect(resultado?.avisoVisto).toBe(true);
    expect(resultado?.rankingGeral).toEqual([
      { clienteId: clienteA.id, nome: "Cliente A", pontos: 10, fotoUrl: null },
    ]);
  });
});
