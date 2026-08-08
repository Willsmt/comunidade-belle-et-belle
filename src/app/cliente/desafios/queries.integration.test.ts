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
});
