import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { limparBanco } from "@/test-utils/db";

const { mockAuth, mockGerarUrlAssinada } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGerarUrlAssinada: vi.fn(),
}));
vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/storage/fotos", () => ({
  gerarUrlAssinada: mockGerarUrlAssinada,
}));

import { listarFotos } from "./queries";

afterEach(async () => {
  await limparBanco();
});

describe("listarFotos (Postgres real)", () => {
  it("retorna só as fotos da própria cliente (públicas e privadas), mais recentes primeiro", async () => {
    const cliente = await prisma.user.create({
      data: { email: "cliente@x.com", status: "ATIVO", name: "Cliente X" },
    });
    const outraCliente = await prisma.user.create({
      data: { email: "outra@x.com", status: "ATIVO", name: "Outra Cliente" },
    });

    await prisma.fotoEvolucao.create({
      data: { clienteId: outraCliente.id, chave: "chave-outra", publica: true },
    });
    const antiga = await prisma.fotoEvolucao.create({
      data: {
        clienteId: cliente.id,
        chave: "chave-antiga",
        publica: false,
        data: new Date("2026-01-01"),
      },
    });
    const recente = await prisma.fotoEvolucao.create({
      data: {
        clienteId: cliente.id,
        chave: "chave-recente",
        publica: true,
        data: new Date("2026-02-01"),
      },
    });

    mockAuth.mockResolvedValue({ user: { id: cliente.id } });
    mockGerarUrlAssinada.mockResolvedValue("https://url-assinada.exemplo");

    const resultado = await listarFotos();

    expect(resultado.map((f) => f.id)).toEqual([recente.id, antiga.id]);
  });
});
