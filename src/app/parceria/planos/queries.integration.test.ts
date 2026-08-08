import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { limparBanco } from "@/test-utils/db";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
vi.mock("@/auth", () => ({ auth: mockAuth }));

import { listarClientesVinculadas, listarPlanosEnviados } from "./queries";

afterEach(async () => {
  await limparBanco();
});

describe("listarClientesVinculadas (Postgres real)", () => {
  it("só retorna clientes com vínculo ativo, ignorando vínculo inativo e de outra parceria", async () => {
    const parceria = await prisma.user.create({
      data: { email: "parceria@x.com", status: "ATIVO", name: "Parceria X" },
    });
    const outraParceria = await prisma.user.create({
      data: { email: "outra-parceria@x.com", status: "ATIVO", name: "Outra Parceria" },
    });
    const clienteAtiva = await prisma.user.create({
      data: { email: "cliente-ativa@x.com", status: "ATIVO", name: "Cliente Ativa" },
    });
    const clienteInativa = await prisma.user.create({
      data: { email: "cliente-inativa@x.com", status: "ATIVO", name: "Cliente Inativa" },
    });
    const clienteDeOutra = await prisma.user.create({
      data: { email: "cliente-outra@x.com", status: "ATIVO", name: "Cliente Outra" },
    });
    const patty = await prisma.user.create({
      data: { email: "patty@x.com", status: "ATIVO", name: "Patty" },
    });

    await prisma.vinculoParceria.create({
      data: { clienteId: clienteAtiva.id, parceriaId: parceria.id, criadoPorId: patty.id, ativo: true },
    });
    await prisma.vinculoParceria.create({
      data: { clienteId: clienteInativa.id, parceriaId: parceria.id, criadoPorId: patty.id, ativo: false },
    });
    await prisma.vinculoParceria.create({
      data: { clienteId: clienteDeOutra.id, parceriaId: outraParceria.id, criadoPorId: patty.id, ativo: true },
    });

    mockAuth.mockResolvedValue({ user: { id: parceria.id } });

    const resultado = await listarClientesVinculadas();

    expect(resultado.map((c) => c.id)).toEqual([clienteAtiva.id]);
  });
});

describe("listarPlanosEnviados (Postgres real)", () => {
  it("só retorna planos enviados pela própria parceria", async () => {
    const parceria = await prisma.user.create({
      data: { email: "parceria2@x.com", status: "ATIVO", name: "Parceria 2" },
    });
    const outraParceria = await prisma.user.create({
      data: { email: "outra-parceria2@x.com", status: "ATIVO", name: "Outra Parceria 2" },
    });
    const cliente = await prisma.user.create({
      data: { email: "cliente2@x.com", status: "ATIVO", name: "Cliente 2" },
    });

    const planoProprio = await prisma.planoRecebido.create({
      data: { clienteId: cliente.id, parceriaId: parceria.id, tipo: "TREINO", arquivoChave: "x" },
    });
    await prisma.planoRecebido.create({
      data: { clienteId: cliente.id, parceriaId: outraParceria.id, tipo: "DIETA", arquivoChave: "y" },
    });

    mockAuth.mockResolvedValue({ user: { id: parceria.id } });

    const resultado = await listarPlanosEnviados();

    expect(resultado.map((p) => p.id)).toEqual([planoProprio.id]);
  });
});
