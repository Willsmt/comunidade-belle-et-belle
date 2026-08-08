import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { limparBanco } from "@/test-utils/db";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
vi.mock("@/auth", () => ({ auth: mockAuth }));

import { listarMedidas } from "./queries";

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
});
