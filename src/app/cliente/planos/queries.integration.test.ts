import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { limparBanco } from "@/test-utils/db";

const { mockAuth, mockGerarUrlAssinada } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGerarUrlAssinada: vi.fn(),
}));
vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/storage/planos", () => ({
  gerarUrlAssinada: mockGerarUrlAssinada,
}));

import { listarPlanosRecebidos } from "./queries";

afterEach(async () => {
  await limparBanco();
});

describe("listarPlanosRecebidos (Postgres real)", () => {
  it("só retorna os planos da própria cliente, mais recentes primeiro", async () => {
    const cliente = await prisma.user.create({
      data: { email: "cliente@x.com", status: "ATIVO", name: "Cliente X" },
    });
    const outraCliente = await prisma.user.create({
      data: { email: "outra@x.com", status: "ATIVO", name: "Outra Cliente" },
    });
    const parceria = await prisma.user.create({
      data: { email: "parceria@x.com", status: "ATIVO", name: "Parceria X" },
    });

    await prisma.planoRecebido.create({
      data: {
        clienteId: outraCliente.id,
        parceriaId: parceria.id,
        tipo: "TREINO",
        arquivoChave: "chave-outra",
      },
    });
    const antigo = await prisma.planoRecebido.create({
      data: {
        clienteId: cliente.id,
        parceriaId: parceria.id,
        tipo: "TREINO",
        arquivoChave: "chave-antiga",
        enviadoEm: new Date("2026-01-01"),
      },
    });
    const recente = await prisma.planoRecebido.create({
      data: {
        clienteId: cliente.id,
        parceriaId: parceria.id,
        tipo: "DIETA",
        arquivoChave: "chave-recente",
        enviadoEm: new Date("2026-02-01"),
      },
    });

    mockAuth.mockResolvedValue({ user: { id: cliente.id } });
    mockGerarUrlAssinada.mockResolvedValue("https://url-assinada.exemplo");

    const resultado = await listarPlanosRecebidos();

    expect(resultado.map((p) => p.id)).toEqual([recente.id, antigo.id]);
  });
});
