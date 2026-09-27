import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { limparBanco } from "@/test-utils/db";
import { listarTiposSessao, listarTiposPacote } from "./queries";

afterEach(async () => {
  await limparBanco();
});

describe("pacotes queries (Postgres real)", () => {
  it("lista tipos de pacote com a composição correta", async () => {
    const aplicacao = await prisma.tipoSessao.create({ data: { nome: "Aplicação" } });
    const radiofrequencia = await prisma.tipoSessao.create({
      data: { nome: "Radiofrequência" },
    });

    await prisma.tipoPacote.create({
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

    const tiposPacote = await listarTiposPacote();

    expect(tiposPacote).toHaveLength(1);
    expect(tiposPacote[0]?.nome).toBe("Projeto Corpo dos Sonhos");
    expect(
      tiposPacote[0]?.itens.map((item) => ({
        tipoSessao: item.tipoSessao.nome,
        quantidade: item.quantidade,
      })),
    ).toEqual(
      expect.arrayContaining([
        { tipoSessao: "Aplicação", quantidade: 4 },
        { tipoSessao: "Radiofrequência", quantidade: 4 },
      ]),
    );
  });

  it("lista tipos de sessão ordenados por nome", async () => {
    await prisma.tipoSessao.create({ data: { nome: "Ultrassom" } });
    await prisma.tipoSessao.create({ data: { nome: "Aplicação" } });

    const tiposSessao = await listarTiposSessao();

    expect(tiposSessao.map((tipo) => tipo.nome)).toEqual(["Aplicação", "Ultrassom"]);
  });
});
