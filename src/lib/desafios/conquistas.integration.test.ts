import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { limparBanco } from "@/test-utils/db";
import {
  verificarConquistasBonus,
  verificarConquistasRankingSemanal,
  verificarConquistaRankingGeral,
} from "./conquistas";

afterEach(async () => {
  await limparBanco();
});

describe("verificarConquistasBonus (Postgres real)", () => {
  it("cria a conquista de LIMIAR_DIARIO quando o cliente marca itens suficientes", async () => {
    const cliente = await prisma.user.create({
      data: { email: "cliente@x.com", status: "ATIVO", name: "Cliente X" },
    });
    const emblema = await prisma.emblema.create({ data: { nome: "Disciplina" } });
    const desafio = await prisma.desafio.create({
      data: {
        titulo: "Glow Up",
        dataInicio: new Date("2026-09-01"),
        dataFim: new Date("2026-09-30"),
      },
    });
    const categoria = await prisma.categoriaDesafio.create({
      data: { desafioId: desafio.id, nome: "Pele", cor: "#f5c" },
    });
    const item1 = await prisma.itemDesafio.create({
      data: { categoriaId: categoria.id, descricao: "Água", pontos: 1 },
    });
    const item2 = await prisma.itemDesafio.create({
      data: { categoriaId: categoria.id, descricao: "Treino", pontos: 1 },
    });
    await prisma.regraBonus.create({
      data: {
        desafioId: desafio.id,
        tipo: "LIMIAR_DIARIO",
        pontosExtras: 5,
        limiarItens: 2,
        emblemaId: emblema.id,
      },
    });

    const hoje = new Date("2026-09-05");
    await prisma.marcacaoItem.create({
      data: { itemId: item1.id, clienteId: cliente.id, data: hoje },
    });
    await prisma.marcacaoItem.create({
      data: { itemId: item2.id, clienteId: cliente.id, data: hoje },
    });

    await verificarConquistasBonus(cliente.id, desafio.id, hoje);

    const conquistas = await prisma.conquista.findMany({ where: { clienteId: cliente.id } });
    expect(conquistas).toHaveLength(1);
    expect(conquistas[0]?.tipo).toBe("BONUS");
    expect(conquistas[0]?.emblemaId).toBe(emblema.id);
  });

  it("não duplica a conquista se a regra já foi batida antes", async () => {
    const cliente = await prisma.user.create({
      data: { email: "cliente@x.com", status: "ATIVO", name: "Cliente X" },
    });
    const emblema = await prisma.emblema.create({ data: { nome: "Disciplina" } });
    const desafio = await prisma.desafio.create({
      data: {
        titulo: "Glow Up",
        dataInicio: new Date("2026-09-01"),
        dataFim: new Date("2026-09-30"),
      },
    });
    const categoria = await prisma.categoriaDesafio.create({
      data: { desafioId: desafio.id, nome: "Pele", cor: "#f5c" },
    });
    const item = await prisma.itemDesafio.create({
      data: { categoriaId: categoria.id, descricao: "Água", pontos: 1 },
    });
    const regra = await prisma.regraBonus.create({
      data: {
        desafioId: desafio.id,
        tipo: "LIMIAR_DIARIO",
        pontosExtras: 5,
        limiarItens: 1,
        emblemaId: emblema.id,
      },
    });
    await prisma.conquista.create({
      data: {
        clienteId: cliente.id,
        desafioId: desafio.id,
        emblemaId: emblema.id,
        tipo: "BONUS",
        referencia: regra.id,
      },
    });

    const hoje = new Date("2026-09-05");
    await prisma.marcacaoItem.create({
      data: { itemId: item.id, clienteId: cliente.id, data: hoje },
    });

    await verificarConquistasBonus(cliente.id, desafio.id, hoje);

    const conquistas = await prisma.conquista.findMany({ where: { clienteId: cliente.id } });
    expect(conquistas).toHaveLength(1);
  });
});

describe("verificarConquistasRankingSemanal (Postgres real)", () => {
  it("premia quem lidera uma semana já encerrada, mas não a semana atual", async () => {
    const clienteA = await prisma.user.create({
      data: { email: "a@x.com", status: "ATIVO", name: "Cliente A" },
    });
    const clienteB = await prisma.user.create({
      data: { email: "b@x.com", status: "ATIVO", name: "Cliente B" },
    });
    const emblema = await prisma.emblema.create({ data: { nome: "Campeã da Semana" } });
    const desafio = await prisma.desafio.create({
      data: {
        titulo: "Glow Up",
        dataInicio: new Date("2026-08-01"),
        dataFim: new Date("2026-08-30"),
        emblemaRankingSemanalId: emblema.id,
      },
    });
    const categoria = await prisma.categoriaDesafio.create({
      data: { desafioId: desafio.id, nome: "Pele", cor: "#f5c" },
    });
    const item = await prisma.itemDesafio.create({
      data: { categoriaId: categoria.id, descricao: "Água", pontos: 10 },
    });

    await prisma.marcacaoItem.create({
      data: { itemId: item.id, clienteId: clienteA.id, data: new Date("2026-08-03") },
    });
    await prisma.marcacaoItem.create({
      data: { itemId: item.id, clienteId: clienteB.id, data: new Date("2026-08-15") },
    });

    const hoje = new Date("2026-08-15");
    await verificarConquistasRankingSemanal(desafio.id, hoje);

    const conquistas = await prisma.conquista.findMany({ where: { tipo: "RANKING_SEMANAL" } });
    expect(conquistas).toHaveLength(1);
    expect(conquistas[0]?.clienteId).toBe(clienteA.id);
    expect(conquistas[0]?.referencia).toBe("semana-0");
  });

  it("premia todos os empatados em 1º lugar", async () => {
    const clienteA = await prisma.user.create({
      data: { email: "a@x.com", status: "ATIVO", name: "Cliente A" },
    });
    const clienteB = await prisma.user.create({
      data: { email: "b@x.com", status: "ATIVO", name: "Cliente B" },
    });
    const emblema = await prisma.emblema.create({ data: { nome: "Campeã da Semana" } });
    const desafio = await prisma.desafio.create({
      data: {
        titulo: "Glow Up",
        dataInicio: new Date("2026-08-01"),
        dataFim: new Date("2026-08-30"),
        emblemaRankingSemanalId: emblema.id,
      },
    });
    const categoria = await prisma.categoriaDesafio.create({
      data: { desafioId: desafio.id, nome: "Pele", cor: "#f5c" },
    });
    const item = await prisma.itemDesafio.create({
      data: { categoriaId: categoria.id, descricao: "Água", pontos: 10 },
    });

    await prisma.marcacaoItem.create({
      data: { itemId: item.id, clienteId: clienteA.id, data: new Date("2026-08-03") },
    });
    await prisma.marcacaoItem.create({
      data: { itemId: item.id, clienteId: clienteB.id, data: new Date("2026-08-04") },
    });

    const hoje = new Date("2026-08-15");
    await verificarConquistasRankingSemanal(desafio.id, hoje);

    const conquistas = await prisma.conquista.findMany({ where: { tipo: "RANKING_SEMANAL" } });
    expect(conquistas).toHaveLength(2);
    expect(conquistas.map((c) => c.clienteId).sort()).toEqual(
      [clienteA.id, clienteB.id].sort(),
    );
  });

  it("não premia de novo uma semana já premiada", async () => {
    const clienteA = await prisma.user.create({
      data: { email: "a@x.com", status: "ATIVO", name: "Cliente A" },
    });
    const emblema = await prisma.emblema.create({ data: { nome: "Campeã da Semana" } });
    const desafio = await prisma.desafio.create({
      data: {
        titulo: "Glow Up",
        dataInicio: new Date("2026-08-01"),
        dataFim: new Date("2026-08-30"),
        emblemaRankingSemanalId: emblema.id,
      },
    });
    const categoria = await prisma.categoriaDesafio.create({
      data: { desafioId: desafio.id, nome: "Pele", cor: "#f5c" },
    });
    const item = await prisma.itemDesafio.create({
      data: { categoriaId: categoria.id, descricao: "Água", pontos: 10 },
    });
    await prisma.marcacaoItem.create({
      data: { itemId: item.id, clienteId: clienteA.id, data: new Date("2026-08-03") },
    });

    const hoje = new Date("2026-08-15");
    await verificarConquistasRankingSemanal(desafio.id, hoje);
    await verificarConquistasRankingSemanal(desafio.id, hoje);

    const conquistas = await prisma.conquista.findMany({ where: { tipo: "RANKING_SEMANAL" } });
    expect(conquistas).toHaveLength(1);
  });
});

describe("verificarConquistaRankingGeral (Postgres real)", () => {
  it("premia a líder geral quando o desafio é analisado", async () => {
    const clienteA = await prisma.user.create({
      data: { email: "a@x.com", status: "ATIVO", name: "Cliente A" },
    });
    const clienteB = await prisma.user.create({
      data: { email: "b@x.com", status: "ATIVO", name: "Cliente B" },
    });
    const emblema = await prisma.emblema.create({ data: { nome: "Campeã Geral" } });
    const desafio = await prisma.desafio.create({
      data: {
        titulo: "Glow Up",
        dataInicio: new Date("2026-08-01"),
        dataFim: new Date("2026-08-30"),
        ativo: false,
        emblemaRankingGeralId: emblema.id,
      },
    });
    const categoria = await prisma.categoriaDesafio.create({
      data: { desafioId: desafio.id, nome: "Pele", cor: "#f5c" },
    });
    const item = await prisma.itemDesafio.create({
      data: { categoriaId: categoria.id, descricao: "Água", pontos: 10 },
    });
    await prisma.marcacaoItem.create({
      data: { itemId: item.id, clienteId: clienteA.id, data: new Date("2026-08-03") },
    });
    await prisma.marcacaoItem.create({
      data: { itemId: item.id, clienteId: clienteA.id, data: new Date("2026-08-10") },
    });
    await prisma.marcacaoItem.create({
      data: { itemId: item.id, clienteId: clienteB.id, data: new Date("2026-08-05") },
    });

    await verificarConquistaRankingGeral(desafio.id);

    const conquistas = await prisma.conquista.findMany({ where: { tipo: "RANKING_GERAL" } });
    expect(conquistas).toHaveLength(1);
    expect(conquistas[0]?.clienteId).toBe(clienteA.id);
  });

  it("não premia de novo se já foi premiada", async () => {
    const clienteA = await prisma.user.create({
      data: { email: "a@x.com", status: "ATIVO", name: "Cliente A" },
    });
    const emblema = await prisma.emblema.create({ data: { nome: "Campeã Geral" } });
    const desafio = await prisma.desafio.create({
      data: {
        titulo: "Glow Up",
        dataInicio: new Date("2026-08-01"),
        dataFim: new Date("2026-08-30"),
        ativo: false,
        emblemaRankingGeralId: emblema.id,
      },
    });
    const categoria = await prisma.categoriaDesafio.create({
      data: { desafioId: desafio.id, nome: "Pele", cor: "#f5c" },
    });
    const item = await prisma.itemDesafio.create({
      data: { categoriaId: categoria.id, descricao: "Água", pontos: 10 },
    });
    await prisma.marcacaoItem.create({
      data: { itemId: item.id, clienteId: clienteA.id, data: new Date("2026-08-03") },
    });

    await verificarConquistaRankingGeral(desafio.id);
    await verificarConquistaRankingGeral(desafio.id);

    const conquistas = await prisma.conquista.findMany({ where: { tipo: "RANKING_GERAL" } });
    expect(conquistas).toHaveLength(1);
  });
});
