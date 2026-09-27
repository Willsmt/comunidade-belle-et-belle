import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { limparBanco } from "@/test-utils/db";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { excluirTipoSessao, excluirTipoPacote, editarTipoPacote } from "./actions";
import { vincularPacote } from "../membros/[membroId]/actions";

afterEach(async () => {
  await limparBanco();
});

function sessaoDe(userId: string, papeis: string[]) {
  return { user: { id: userId, papeis } };
}

describe("excluirTipoSessao (Postgres real)", () => {
  it("apaga de verdade quando nunca foi usado em nenhum tipo de pacote nem ciclo", async () => {
    const gestora = await prisma.user.create({
      data: { email: "gestora-excl-ts@x.com", status: "ATIVO", name: "Patty" },
    });
    const tipoSessao = await prisma.tipoSessao.create({ data: { nome: "Peeling" } });

    mockAuth.mockResolvedValueOnce(sessaoDe(gestora.id, ["GESTORA"]));
    await excluirTipoSessao(tipoSessao.id);

    const encontrado = await prisma.tipoSessao.findUnique({ where: { id: tipoSessao.id } });
    expect(encontrado).toBeNull();
  });

  it("arquiva (não apaga) quando já está na composição de um tipo de pacote", async () => {
    const gestora = await prisma.user.create({
      data: { email: "gestora-excl-ts2@x.com", status: "ATIVO", name: "Patty" },
    });
    const tipoSessao = await prisma.tipoSessao.create({ data: { nome: "Peeling" } });
    await prisma.tipoPacote.create({
      data: {
        nome: "Pacote com Peeling",
        itens: { create: [{ tipoSessaoId: tipoSessao.id, quantidade: 2 }] },
      },
    });

    mockAuth.mockResolvedValueOnce(sessaoDe(gestora.id, ["GESTORA"]));
    await excluirTipoSessao(tipoSessao.id);

    const encontrado = await prisma.tipoSessao.findUniqueOrThrow({ where: { id: tipoSessao.id } });
    expect(encontrado.ativo).toBe(false);
  });
});

describe("excluirTipoPacote (Postgres real)", () => {
  it("apaga de verdade (cascata do ItemTipoPacote) quando nunca foi vinculado a nenhuma cliente", async () => {
    const gestora = await prisma.user.create({
      data: { email: "gestora-excl-tp@x.com", status: "ATIVO", name: "Patty" },
    });
    const tipoSessao = await prisma.tipoSessao.create({ data: { nome: "Peeling" } });
    const tipoPacote = await prisma.tipoPacote.create({
      data: {
        nome: "Pacote Nunca Usado",
        itens: { create: [{ tipoSessaoId: tipoSessao.id, quantidade: 2 }] },
      },
    });

    mockAuth.mockResolvedValueOnce(sessaoDe(gestora.id, ["GESTORA"]));
    await excluirTipoPacote(tipoPacote.id);

    const encontrado = await prisma.tipoPacote.findUnique({ where: { id: tipoPacote.id } });
    expect(encontrado).toBeNull();
    const itens = await prisma.itemTipoPacote.findMany({ where: { tipoPacoteId: tipoPacote.id } });
    expect(itens).toHaveLength(0);
  });

  it("arquiva (não apaga) quando já foi vinculado a uma cliente, e o ciclo dela continua intacto", async () => {
    const gestora = await prisma.user.create({
      data: { email: "gestora-excl-tp2@x.com", status: "ATIVO", name: "Patty" },
    });
    const cliente = await prisma.user.create({
      data: { email: "cliente-excl-tp@x.com", status: "ATIVO", name: "Ana" },
    });
    const tipoSessao = await prisma.tipoSessao.create({ data: { nome: "Peeling" } });
    const tipoPacote = await prisma.tipoPacote.create({
      data: {
        nome: "Pacote Já Usado",
        itens: { create: [{ tipoSessaoId: tipoSessao.id, quantidade: 2 }] },
      },
    });

    mockAuth.mockResolvedValueOnce(sessaoDe(gestora.id, ["GESTORA"]));
    await vincularPacote(cliente.id, tipoPacote.id);

    mockAuth.mockResolvedValueOnce(sessaoDe(gestora.id, ["GESTORA"]));
    await excluirTipoPacote(tipoPacote.id);

    const encontrado = await prisma.tipoPacote.findUniqueOrThrow({ where: { id: tipoPacote.id } });
    expect(encontrado.ativo).toBe(false);

    const cicloDaCliente = await prisma.cicloPacote.findFirstOrThrow({
      where: { clienteId: cliente.id },
      include: { itens: true },
    });
    expect(cicloDaCliente.ativo).toBe(true);
    expect(cicloDaCliente.itens).toHaveLength(1);
  });
});

describe("editarTipoPacote (Postgres real)", () => {
  it("troca a composição do catálogo sem alterar a de um ciclo já criado (FR-013)", async () => {
    const gestora = await prisma.user.create({
      data: { email: "gestora-edit-tp@x.com", status: "ATIVO", name: "Patty" },
    });
    const cliente = await prisma.user.create({
      data: { email: "cliente-edit-tp@x.com", status: "ATIVO", name: "Ana" },
    });
    const aplicacao = await prisma.tipoSessao.create({ data: { nome: "Aplicação" } });
    const ultrassom = await prisma.tipoSessao.create({ data: { nome: "Ultrassom" } });
    const tipoPacote = await prisma.tipoPacote.create({
      data: {
        nome: "Projeto Corpo dos Sonhos",
        itens: { create: [{ tipoSessaoId: aplicacao.id, quantidade: 4 }] },
      },
    });

    mockAuth.mockResolvedValueOnce(sessaoDe(gestora.id, ["GESTORA"]));
    await vincularPacote(cliente.id, tipoPacote.id);

    const formData = new FormData();
    formData.set("id", tipoPacote.id);
    formData.set("nome", "Projeto Corpo dos Sonhos 2.0");
    formData.set(`quantidade-${ultrassom.id}`, "6");

    mockAuth.mockResolvedValueOnce(sessaoDe(gestora.id, ["GESTORA"]));
    await editarTipoPacote(formData);

    const tipoPacoteAtualizado = await prisma.tipoPacote.findUniqueOrThrow({
      where: { id: tipoPacote.id },
      include: { itens: true },
    });
    expect(tipoPacoteAtualizado.nome).toBe("Projeto Corpo dos Sonhos 2.0");
    expect(tipoPacoteAtualizado.itens).toEqual([
      expect.objectContaining({ tipoSessaoId: ultrassom.id, quantidade: 6 }),
    ]);

    const cicloDaCliente = await prisma.cicloPacote.findFirstOrThrow({
      where: { clienteId: cliente.id },
      include: { itens: true },
    });
    expect(cicloDaCliente.nomePacote).toBe("Projeto Corpo dos Sonhos");
    expect(cicloDaCliente.itens).toEqual([
      expect.objectContaining({ tipoSessaoId: aplicacao.id, quantidadeContratada: 4 }),
    ]);
  });
});
