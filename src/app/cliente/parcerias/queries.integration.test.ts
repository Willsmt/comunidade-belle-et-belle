import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { limparBanco } from "@/test-utils/db";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
vi.mock("@/auth", () => ({ auth: mockAuth }));

import { listarParceriasVinculadas } from "./queries";

afterEach(async () => {
  await limparBanco();
});

describe("listarParceriasVinculadas (Postgres real)", () => {
  it("retorna só as parcerias com vínculo ATIVO da cliente logada", async () => {
    const cliente = await prisma.user.create({
      data: { email: "cliente@x.com", status: "ATIVO", name: "Cliente X" },
    });
    const parceriaAtiva = await prisma.user.create({
      data: { email: "ativa@x.com", status: "ATIVO", name: "Parceria Ativa" },
    });
    const parceriaInativa = await prisma.user.create({
      data: {
        email: "inativa@x.com",
        status: "ATIVO",
        name: "Parceria Inativa",
      },
    });
    const outraCliente = await prisma.user.create({
      data: {
        email: "outra-cliente@x.com",
        status: "ATIVO",
        name: "Outra Cliente",
      },
    });

    await prisma.perfilParceria.create({
      data: { usuarioId: parceriaAtiva.id, especialidade: "Nutrição" },
    });

    await prisma.vinculoParceria.create({
      data: {
        clienteId: cliente.id,
        parceriaId: parceriaAtiva.id,
        ativo: true,
        criadoPorId: cliente.id,
      },
    });
    await prisma.vinculoParceria.create({
      data: {
        clienteId: cliente.id,
        parceriaId: parceriaInativa.id,
        ativo: false,
        criadoPorId: cliente.id,
      },
    });
    await prisma.vinculoParceria.create({
      data: {
        clienteId: outraCliente.id,
        parceriaId: parceriaAtiva.id,
        ativo: true,
        criadoPorId: outraCliente.id,
      },
    });

    mockAuth.mockResolvedValue({ user: { id: cliente.id } });

    const resultado = await listarParceriasVinculadas();

    expect(resultado).toHaveLength(1);
    expect(resultado[0]?.nome).toBe("Parceria Ativa");
    expect(resultado[0]?.especialidade).toBe("Nutrição");
  });
});
