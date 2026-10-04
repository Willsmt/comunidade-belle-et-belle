vi.mock("@/lib/auth/requerer-acesso-painel", () => ({
  requererAcessoPainelOuRedirecionar: vi.fn(),
}));

import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { limparBanco } from "@/test-utils/db";
import { listarHistoricoCiclos } from "./queries";

afterEach(async () => {
  await limparBanco();
});

describe("listarHistoricoCiclos (Postgres real)", () => {
  it("retorna as sessões do ciclo ativo e do ciclo arquivado, cada uma atribuída ao ciclo certo", async () => {
    const patty = await prisma.user.create({
      data: { email: "patty-historico@x.com", status: "ATIVO", name: "Patty" },
    });
    const cliente = await prisma.user.create({
      data: { email: "cliente-historico@x.com", status: "ATIVO", name: "Ana" },
    });
    const aplicacao = await prisma.tipoSessao.create({ data: { nome: "Aplicação" } });

    const cicloArquivado = await prisma.cicloPacote.create({
      data: {
        clienteId: cliente.id,
        tipoPacoteId: (
          await prisma.tipoPacote.create({
            data: {
              nome: "Pacote Antigo",
              itens: { create: [{ tipoSessaoId: aplicacao.id, quantidade: 4 }] },
            },
          })
        ).id,
        nomePacote: "Pacote Antigo",
        ativo: false,
        arquivadoEm: new Date("2026-08-15"),
        itens: { create: [{ tipoSessaoId: aplicacao.id, quantidadeContratada: 4 }] },
        sessoes: {
          create: [
            { tipoSessaoId: aplicacao.id, data: new Date("2026-08-01"), marcadoPorId: patty.id },
          ],
        },
      },
    });

    const cicloAtivo = await prisma.cicloPacote.create({
      data: {
        clienteId: cliente.id,
        tipoPacoteId: (
          await prisma.tipoPacote.create({
            data: {
              nome: "Pacote Novo",
              itens: { create: [{ tipoSessaoId: aplicacao.id, quantidade: 4 }] },
            },
          })
        ).id,
        nomePacote: "Pacote Novo",
        ativo: true,
        itens: { create: [{ tipoSessaoId: aplicacao.id, quantidadeContratada: 4 }] },
        sessoes: {
          create: [
            { tipoSessaoId: aplicacao.id, data: new Date("2026-09-10"), marcadoPorId: patty.id },
          ],
        },
      },
    });

    const historico = await listarHistoricoCiclos(cliente.id);

    expect(historico).toHaveLength(2);

    const historicoArquivado = historico.find((ciclo) => ciclo.id === cicloArquivado.id);
    expect(historicoArquivado?.ativo).toBe(false);
    expect(historicoArquivado?.sessoes).toEqual([
      expect.objectContaining({ tipoSessaoNome: "Aplicação", data: new Date("2026-08-01") }),
    ]);

    const historicoAtivo = historico.find((ciclo) => ciclo.id === cicloAtivo.id);
    expect(historicoAtivo?.ativo).toBe(true);
    expect(historicoAtivo?.sessoes).toEqual([
      expect.objectContaining({ tipoSessaoNome: "Aplicação", data: new Date("2026-09-10") }),
    ]);
  });
});
