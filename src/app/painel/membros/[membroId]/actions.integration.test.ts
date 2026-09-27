import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { limparBanco } from "@/test-utils/db";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { vincularPacote, marcarSessaoRealizada, desfazerSessaoRealizada } from "./actions";
import { obterCicloAtivo } from "./queries";

afterEach(async () => {
  await limparBanco();
});

function sessaoDe(userId: string, papeis: string[]) {
  return { user: { id: userId, papeis } };
}

describe("fluxo de pacote de sessões (Postgres real)", () => {
  it("vincula, marca até o limite, bloqueia a sessão excedente e desfazer decrementa o contador", async () => {
    const gestora = await prisma.user.create({
      data: { email: "gestora@x.com", status: "ATIVO", name: "Patty" },
    });
    const cliente = await prisma.user.create({
      data: { email: "cliente@x.com", status: "ATIVO", name: "Ana" },
    });
    const aplicacao = await prisma.tipoSessao.create({ data: { nome: "Aplicação" } });
    const radiofrequencia = await prisma.tipoSessao.create({
      data: { nome: "Radiofrequência" },
    });
    const tipoPacote = await prisma.tipoPacote.create({
      data: {
        nome: "Projeto Corpo dos Sonhos",
        itens: {
          create: [
            { tipoSessaoId: aplicacao.id, quantidade: 4 },
            { tipoSessaoId: radiofrequencia.id, quantidade: 4 },
          ],
        },
      },
    });

    mockAuth.mockResolvedValueOnce(sessaoDe(gestora.id, ["GESTORA"]));
    await vincularPacote(cliente.id, tipoPacote.id);

    const cicloInicial = await obterCicloAtivo(cliente.id);
    expect(cicloInicial?.itens).toEqual(
      expect.arrayContaining([
        { tipoSessaoId: aplicacao.id, tipoSessaoNome: "Aplicação", quantidadeContratada: 4, quantidadeRealizada: 0 },
        {
          tipoSessaoId: radiofrequencia.id,
          tipoSessaoNome: "Radiofrequência",
          quantidadeContratada: 4,
          quantidadeRealizada: 0,
        },
      ]),
    );
    const cicloId = cicloInicial?.id;
    if (!cicloId) throw new Error("ciclo ativo não foi criado");

    for (let i = 0; i < 4; i++) {
      mockAuth.mockResolvedValueOnce(sessaoDe(gestora.id, ["GESTORA"]));
      await marcarSessaoRealizada(cicloId, aplicacao.id);
    }

    mockAuth.mockResolvedValueOnce(sessaoDe(gestora.id, ["GESTORA"]));
    await expect(marcarSessaoRealizada(cicloId, aplicacao.id)).rejects.toThrow(
      "O limite do pacote para esse tipo de sessão já foi cumprido",
    );

    const cicloCompleto = await obterCicloAtivo(cliente.id);
    const itemAplicacao = cicloCompleto?.itens.find((item) => item.tipoSessaoId === aplicacao.id);
    expect(itemAplicacao?.quantidadeRealizada).toBe(4);

    const sessaoParaDesfazer = cicloCompleto?.sessoes.find(
      (sessao) => sessao.tipoSessaoNome === "Aplicação",
    );
    if (!sessaoParaDesfazer) throw new Error("sessão não encontrada");

    mockAuth.mockResolvedValueOnce(sessaoDe(gestora.id, ["GESTORA"]));
    await desfazerSessaoRealizada(sessaoParaDesfazer.id);

    const cicloFinal = await obterCicloAtivo(cliente.id);
    const itemFinal = cicloFinal?.itens.find((item) => item.tipoSessaoId === aplicacao.id);
    expect(itemFinal?.quantidadeRealizada).toBe(3);
  });

  it("no máximo um ciclo ativo por cliente: vincular de novo arquiva o ciclo anterior sem apagar seus dados", async () => {
    const gestora = await prisma.user.create({
      data: { email: "gestora2@x.com", status: "ATIVO", name: "Patty" },
    });
    const cliente = await prisma.user.create({
      data: { email: "cliente2@x.com", status: "ATIVO", name: "Bia" },
    });
    const aplicacao = await prisma.tipoSessao.create({ data: { nome: "Aplicação" } });
    const tipoPacote = await prisma.tipoPacote.create({
      data: {
        nome: "Projeto Corpo dos Sonhos",
        itens: { create: [{ tipoSessaoId: aplicacao.id, quantidade: 4 }] },
      },
    });

    mockAuth.mockResolvedValueOnce(sessaoDe(gestora.id, ["GESTORA"]));
    await vincularPacote(cliente.id, tipoPacote.id);

    const cicloAntigo = await obterCicloAtivo(cliente.id);
    if (!cicloAntigo) throw new Error("ciclo ativo não foi criado");

    mockAuth.mockResolvedValueOnce(sessaoDe(gestora.id, ["GESTORA"]));
    await marcarSessaoRealizada(cicloAntigo.id, aplicacao.id);

    mockAuth.mockResolvedValueOnce(sessaoDe(gestora.id, ["GESTORA"]));
    await vincularPacote(cliente.id, tipoPacote.id);

    const cicloNovo = await obterCicloAtivo(cliente.id);
    expect(cicloNovo?.id).not.toBe(cicloAntigo.id);
    expect(cicloNovo?.itens[0]?.quantidadeRealizada).toBe(0);

    const cicloAntigoNoBanco = await prisma.cicloPacote.findUniqueOrThrow({
      where: { id: cicloAntigo.id },
      include: { sessoes: true },
    });
    expect(cicloAntigoNoBanco.ativo).toBe(false);
    expect(cicloAntigoNoBanco.arquivadoEm).not.toBeNull();
    expect(cicloAntigoNoBanco.sessoes).toHaveLength(1);
  });
});
