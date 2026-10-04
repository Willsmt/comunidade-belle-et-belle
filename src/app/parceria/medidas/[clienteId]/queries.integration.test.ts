import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { limparBanco } from "@/test-utils/db";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
vi.mock("@/auth", () => ({ auth: mockAuth }));

import { obterMedidasDaCliente } from "./queries";

afterEach(async () => {
  await limparBanco();
});

async function criarParceriaClienteEVinculo(ativo = true) {
  const parceria = await prisma.user.create({
    data: { email: `parceria-${Date.now()}-${Math.random()}@x.com`, status: "ATIVO", name: "Parceria" },
  });
  const cliente = await prisma.user.create({
    data: { email: `cliente-${Date.now()}-${Math.random()}@x.com`, status: "ATIVO", name: "Cliente" },
  });
  await prisma.vinculoParceria.create({
    data: { clienteId: cliente.id, parceriaId: parceria.id, criadoPorId: parceria.id, ativo },
  });
  return { parceria, cliente };
}

function mockSessaoParceria(parceriaId: string) {
  mockAuth.mockResolvedValue({ user: { id: parceriaId, status: "ATIVO", papeis: ["PARCERIA"] } });
}

describe("obterMedidasDaCliente (Postgres real)", () => {
  it("com vínculo ativo, retorna o histórico completo e correto da cliente, incluindo campos bilaterais", async () => {
    const { parceria, cliente } = await criarParceriaClienteEVinculo(true);
    await prisma.registroMedida.create({
      data: {
        clienteId: cliente.id,
        peso: 60,
        bracoDireito: 30,
        bracoEsquerdo: 28,
      },
    });
    mockSessaoParceria(parceria.id);

    const resultado = await obterMedidasDaCliente(cliente.id);

    expect(resultado.cliente.id).toBe(cliente.id);
    expect(resultado.medidas).toHaveLength(1);
    expect(resultado.medidas[0].bracoDireito?.toNumber()).toBe(30);
    expect(resultado.medidas[0].bracoEsquerdo?.toNumber()).toBe(28);
  });

  it("isola o histórico entre duas clientes vinculadas à mesma parceria — nunca mistura os registros", async () => {
    const parceria = await prisma.user.create({
      data: { email: "parceria-isolamento@x.com", status: "ATIVO", name: "Parceria" },
    });
    const clienteA = await prisma.user.create({
      data: { email: "cliente-a-isolamento@x.com", status: "ATIVO", name: "Cliente A" },
    });
    const clienteB = await prisma.user.create({
      data: { email: "cliente-b-isolamento@x.com", status: "ATIVO", name: "Cliente B" },
    });
    await prisma.vinculoParceria.create({
      data: { clienteId: clienteA.id, parceriaId: parceria.id, criadoPorId: parceria.id, ativo: true },
    });
    await prisma.vinculoParceria.create({
      data: { clienteId: clienteB.id, parceriaId: parceria.id, criadoPorId: parceria.id, ativo: true },
    });
    await prisma.registroMedida.create({ data: { clienteId: clienteA.id, peso: 60 } });
    await prisma.registroMedida.create({ data: { clienteId: clienteB.id, peso: 70 } });
    mockSessaoParceria(parceria.id);

    const resultadoA = await obterMedidasDaCliente(clienteA.id);
    const resultadoB = await obterMedidasDaCliente(clienteB.id);

    expect(resultadoA.medidas).toHaveLength(1);
    expect(resultadoA.medidas[0].peso?.toNumber()).toBe(60);
    expect(resultadoB.medidas).toHaveLength(1);
    expect(resultadoB.medidas[0].peso?.toNumber()).toBe(70);
  });

  it("lança AppError quando não existe vínculo entre a parceria e a cliente", async () => {
    const parceria = await prisma.user.create({
      data: { email: "parceria-sem-vinculo@x.com", status: "ATIVO", name: "Parceria" },
    });
    const cliente = await prisma.user.create({
      data: { email: "cliente-sem-vinculo@x.com", status: "ATIVO", name: "Cliente" },
    });
    mockSessaoParceria(parceria.id);

    await expect(obterMedidasDaCliente(cliente.id)).rejects.toThrow(
      "Cliente não vinculada a você",
    );
  });

  it("bloqueia o acesso depois que o vínculo é desativado, e libera de novo quando é reativado", async () => {
    const { parceria, cliente } = await criarParceriaClienteEVinculo(true);
    mockSessaoParceria(parceria.id);

    await obterMedidasDaCliente(cliente.id);

    await prisma.vinculoParceria.update({
      where: { clienteId_parceriaId: { clienteId: cliente.id, parceriaId: parceria.id } },
      data: { ativo: false },
    });

    await expect(obterMedidasDaCliente(cliente.id)).rejects.toThrow(
      "Cliente não vinculada a você",
    );

    await prisma.vinculoParceria.update({
      where: { clienteId_parceriaId: { clienteId: cliente.id, parceriaId: parceria.id } },
      data: { ativo: true },
    });

    await expect(obterMedidasDaCliente(cliente.id)).resolves.toBeDefined();
  });
});
