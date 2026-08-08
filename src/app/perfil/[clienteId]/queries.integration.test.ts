import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { limparBanco } from "@/test-utils/db";

const { mockAuth, mockGerarUrlAssinada } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGerarUrlAssinada: vi.fn(),
}));
vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/storage/fotos", () => ({
  gerarUrlAssinada: mockGerarUrlAssinada,
}));

import { obterPerfilPublico } from "./queries";

afterEach(async () => {
  await limparBanco();
});

describe("obterPerfilPublico (Postgres real)", () => {
  it("respeita o toggle de privacidade de medidas ponta a ponta", async () => {
    const viewer = await prisma.user.create({
      data: { email: "viewer@example.com", status: "ATIVO", name: "Viewer" },
    });
    const cliente = await prisma.user.create({
      data: { email: "cliente@example.com", status: "ATIVO", name: "Cliente" },
    });
    await prisma.perfil.create({
      data: { userId: cliente.id, bio: "oi", bioPublica: true, medidasPublicas: false },
    });
    await prisma.registroMedida.create({
      data: { clienteId: cliente.id, peso: 60 },
    });

    mockAuth.mockResolvedValue({ user: { id: viewer.id } });

    const resultado = await obterPerfilPublico(cliente.id);

    expect(resultado?.bio).toBe("oi");
    expect(resultado?.ultimaMedida).toBeNull();
  });

  it("mostra a medida mais recente quando medidasPublicas é true", async () => {
    const viewer = await prisma.user.create({
      data: { email: "viewer2@example.com", status: "ATIVO", name: "Viewer" },
    });
    const cliente = await prisma.user.create({
      data: { email: "cliente2@example.com", status: "ATIVO", name: "Cliente 2" },
    });
    await prisma.perfil.create({
      data: { userId: cliente.id, medidasPublicas: true },
    });
    await prisma.registroMedida.create({
      data: { clienteId: cliente.id, peso: 65, data: new Date("2026-01-01") },
    });
    const recente = await prisma.registroMedida.create({
      data: { clienteId: cliente.id, peso: 62, data: new Date("2026-02-01") },
    });

    mockAuth.mockResolvedValue({ user: { id: viewer.id } });

    const resultado = await obterPerfilPublico(cliente.id);

    expect(resultado?.ultimaMedida?.id).toBe(recente.id);
  });

  it("mostra só as fotos marcadas como públicas, ignorando as privadas", async () => {
    const viewer = await prisma.user.create({
      data: { email: "viewer3@example.com", status: "ATIVO", name: "Viewer" },
    });
    const cliente = await prisma.user.create({
      data: { email: "cliente3@example.com", status: "ATIVO", name: "Cliente 3" },
    });
    const fotoPublica = await prisma.fotoEvolucao.create({
      data: { clienteId: cliente.id, chave: "chave-publica", publica: true },
    });
    await prisma.fotoEvolucao.create({
      data: { clienteId: cliente.id, chave: "chave-privada", publica: false },
    });

    mockAuth.mockResolvedValue({ user: { id: viewer.id } });
    mockGerarUrlAssinada.mockResolvedValue("https://url-assinada.exemplo");

    const resultado = await obterPerfilPublico(cliente.id);

    expect(resultado?.fotos).toHaveLength(1);
    expect(resultado?.fotos[0]?.id).toBe(fotoPublica.id);
  });
});
