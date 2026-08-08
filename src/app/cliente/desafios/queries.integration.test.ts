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

import { obterDesafioAtivoParaCliente } from "./queries";

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
      { clienteId: clienteA.id, nome: "Cliente A", pontos: 10 },
      { clienteId: clienteB.id, nome: "Cliente B", pontos: 5 },
    ]);
    expect(resultado?.rankingSemanal).toHaveLength(2);
    expect(resultado?.rankingSemanal).toEqual(
      expect.arrayContaining([
        { clienteId: clienteA.id, nome: "Cliente A", pontos: 5 },
        { clienteId: clienteB.id, nome: "Cliente B", pontos: 5 },
      ]),
    );
  });
});
