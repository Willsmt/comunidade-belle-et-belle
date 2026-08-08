import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { limparBanco } from "@/test-utils/db";
import { listarVinculos, listarClientesEParcerias } from "./queries";

afterEach(async () => {
  await limparBanco();
});

describe("listarClientesEParcerias (Postgres real)", () => {
  it("só retorna usuários ATIVO com o papel certo, ignorando SUSPENSO e papéis errados", async () => {
    const clienteAtiva = await prisma.user.create({
      data: { email: "cliente-ativa@x.com", status: "ATIVO", name: "Cliente Ativa" },
    });
    await prisma.usuarioPapel.create({
      data: { userId: clienteAtiva.id, papel: "CLIENTE" },
    });

    const clienteSuspensa = await prisma.user.create({
      data: { email: "cliente-susp@x.com", status: "SUSPENSO", name: "Cliente Susp" },
    });
    await prisma.usuarioPapel.create({
      data: { userId: clienteSuspensa.id, papel: "CLIENTE" },
    });

    const parceriaAtiva = await prisma.user.create({
      data: { email: "parceria-ativa@x.com", status: "ATIVO", name: "Parceria Ativa" },
    });
    await prisma.usuarioPapel.create({
      data: { userId: parceriaAtiva.id, papel: "PARCERIA" },
    });

    const resultado = await listarClientesEParcerias();

    expect(resultado.clientes.map((c) => c.id)).toEqual([clienteAtiva.id]);
    expect(resultado.parcerias.map((p) => p.id)).toEqual([parceriaAtiva.id]);
  });
});

describe("listarVinculos (Postgres real)", () => {
  it("inclui os dados de cliente e parceria no vínculo", async () => {
    const cliente = await prisma.user.create({
      data: { email: "cliente@x.com", status: "ATIVO", name: "Cliente X" },
    });
    const parceria = await prisma.user.create({
      data: { email: "parceria@x.com", status: "ATIVO", name: "Parceria X" },
    });
    const patty = await prisma.user.create({
      data: { email: "patty@x.com", status: "ATIVO", name: "Patty" },
    });
    await prisma.vinculoParceria.create({
      data: { clienteId: cliente.id, parceriaId: parceria.id, criadoPorId: patty.id },
    });

    const resultado = await listarVinculos();

    expect(resultado).toHaveLength(1);
    expect(resultado[0]?.cliente.name).toBe("Cliente X");
    expect(resultado[0]?.parceria.name).toBe("Parceria X");
  });
});
