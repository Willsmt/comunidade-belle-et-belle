import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { limparBanco } from "@/test-utils/db";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { criarRegraLimiar } from "./actions";
import { alternarMarcacao } from "@/app/cliente/desafios/actions";

afterEach(async () => {
  await limparBanco();
});

function buildFormData(campos: Record<string, string>) {
  const formData = new FormData();
  for (const [chave, valor] of Object.entries(campos)) {
    formData.set(chave, valor);
  }
  return formData;
}

function sessaoDe(userId: string, papeis: string[]) {
  return { user: { id: userId, papeis } };
}

describe("regra de bônus conectada a um emblema até a Conquista (Postgres real)", () => {
  it("cria a Conquista de verdade quando a cliente satisfaz a regra ligada a um emblema do catálogo", async () => {
    const gestora = await prisma.user.create({
      data: { email: "gestora@x.com", status: "ATIVO", name: "Gestora" },
    });
    const cliente = await prisma.user.create({
      data: { email: "cliente@x.com", status: "ATIVO", name: "Cliente" },
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

    mockAuth.mockResolvedValueOnce(sessaoDe(gestora.id, ["GESTORA"]));
    await criarRegraLimiar(
      desafio.id,
      buildFormData({ limiarItens: "1", pontosExtras: "5", emblemaId: emblema.id }),
    );

    const regra = await prisma.regraBonus.findFirst({ where: { desafioId: desafio.id } });
    expect(regra?.emblemaId).toBe(emblema.id);

    mockAuth.mockResolvedValueOnce(sessaoDe(cliente.id, ["CLIENTE"]));
    await alternarMarcacao(item.id);

    const conquistas = await prisma.conquista.findMany({ where: { clienteId: cliente.id } });
    expect(conquistas).toHaveLength(1);
    expect(conquistas[0]?.emblemaId).toBe(emblema.id);
    expect(conquistas[0]?.tipo).toBe("BONUS");
  });

  it("não cria Conquista quando a regra é criada sem emblema selecionado", async () => {
    const gestora = await prisma.user.create({
      data: { email: "gestora@x.com", status: "ATIVO", name: "Gestora" },
    });
    const cliente = await prisma.user.create({
      data: { email: "cliente@x.com", status: "ATIVO", name: "Cliente" },
    });
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

    mockAuth.mockResolvedValueOnce(sessaoDe(gestora.id, ["GESTORA"]));
    await criarRegraLimiar(desafio.id, buildFormData({ limiarItens: "1", pontosExtras: "5" }));

    const regra = await prisma.regraBonus.findFirst({ where: { desafioId: desafio.id } });
    expect(regra?.emblemaId).toBeNull();

    mockAuth.mockResolvedValueOnce(sessaoDe(cliente.id, ["CLIENTE"]));
    await alternarMarcacao(item.id);

    const conquistas = await prisma.conquista.findMany({ where: { clienteId: cliente.id } });
    expect(conquistas).toHaveLength(0);
  });
});
