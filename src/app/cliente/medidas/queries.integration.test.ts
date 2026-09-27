import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { limparBanco } from "@/test-utils/db";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { listarMedidas } from "./queries";
import { criarRegistroMedida } from "./actions";

function buildFormData(campos: Record<string, string>) {
  const formData = new FormData();
  for (const [chave, valor] of Object.entries(campos)) {
    formData.set(chave, valor);
  }
  return formData;
}

afterEach(async () => {
  await limparBanco();
});

describe("listarMedidas (Postgres real)", () => {
  it("retorna só as medidas do usuário logado, mais recentes primeiro", async () => {
    const cliente = await prisma.user.create({
      data: { email: "cliente@example.com", status: "ATIVO", name: "Cliente" },
    });
    const outraCliente = await prisma.user.create({
      data: { email: "outra@example.com", status: "ATIVO", name: "Outra" },
    });

    await prisma.registroMedida.create({
      data: { clienteId: outraCliente.id, peso: 55 },
    });
    const antiga = await prisma.registroMedida.create({
      data: { clienteId: cliente.id, peso: 60, data: new Date("2026-01-01") },
    });
    const recente = await prisma.registroMedida.create({
      data: { clienteId: cliente.id, peso: 58, data: new Date("2026-02-01") },
    });

    mockAuth.mockResolvedValue({ user: { id: cliente.id } });

    const resultado = await listarMedidas();

    expect(resultado.map((medida) => medida.id)).toEqual([
      recente.id,
      antiga.id,
    ]);
  });

  it("um registro anterior a esta feature (só braco/coxa) continua legível sem erro, com os campos novos nulos", async () => {
    const cliente = await prisma.user.create({
      data: { email: "cliente-antiga@example.com", status: "ATIVO", name: "Cliente Antiga" },
    });
    const antigo = await prisma.registroMedida.create({
      data: { clienteId: cliente.id, braco: 28, coxa: 55 },
    });

    mockAuth.mockResolvedValue({ user: { id: cliente.id } });

    const [resultado] = await listarMedidas();

    expect(resultado.id).toBe(antigo.id);
    expect(resultado.braco?.toNumber()).toBe(28);
    expect(resultado.coxa?.toNumber()).toBe(55);
    expect(resultado.bracoDireito).toBeNull();
    expect(resultado.ombro).toBeNull();
    expect(resultado.altura).toBeNull();
  });

  it("criarRegistroMedida grava valores bilaterais assimétricos e persiste cada lado separadamente", async () => {
    const cliente = await prisma.user.create({
      data: { email: "cliente-bilateral@example.com", status: "ATIVO", name: "Cliente Bilateral" },
    });
    mockAuth.mockResolvedValue({ user: { id: cliente.id, papeis: ["CLIENTE"] } });

    await criarRegistroMedida(
      buildFormData({
        bracoDireito: "30",
        bracoEsquerdo: "28",
        joelhoDireito: "40",
      }),
    );

    const [registro] = await listarMedidas();

    expect(registro.bracoDireito?.toNumber()).toBe(30);
    expect(registro.bracoEsquerdo?.toNumber()).toBe(28);
    expect(registro.joelhoDireito?.toNumber()).toBe(40);
    expect(registro.joelhoEsquerdo).toBeNull();
    expect(registro.braco).toBeNull();
  });
});
