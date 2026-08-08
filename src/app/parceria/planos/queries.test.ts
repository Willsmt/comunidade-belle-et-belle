import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockFindManyVinculo, mockFindManyPlano } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockFindManyVinculo: vi.fn(),
  mockFindManyPlano: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    vinculoParceria: { findMany: mockFindManyVinculo },
    planoRecebido: { findMany: mockFindManyPlano },
  },
}));

import { listarClientesVinculadas, listarPlanosEnviados } from "./queries";

describe("listarClientesVinculadas", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockFindManyVinculo.mockReset();
  });

  it("lança erro se não houver sessão", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(listarClientesVinculadas()).rejects.toThrow("Sessão inválida");
  });

  it("busca só vínculos ativos da parceria logada e retorna as clientes", async () => {
    mockAuth.mockResolvedValue({ user: { id: "parceria-1" } });
    mockFindManyVinculo.mockResolvedValue([
      { cliente: { id: "c1", name: "Cliente 1", email: "c1@x.com" } },
    ]);

    const resultado = await listarClientesVinculadas();

    expect(mockFindManyVinculo).toHaveBeenCalledWith({
      where: { parceriaId: "parceria-1", ativo: true },
      include: { cliente: { select: { id: true, name: true, email: true } } },
      orderBy: { criadoEm: "asc" },
    });
    expect(resultado).toEqual([{ id: "c1", name: "Cliente 1", email: "c1@x.com" }]);
  });
});

describe("listarPlanosEnviados", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockFindManyPlano.mockReset();
  });

  it("busca só planos enviados pela parceria logada, mais recentes primeiro", async () => {
    mockAuth.mockResolvedValue({ user: { id: "parceria-1" } });
    mockFindManyPlano.mockResolvedValue([]);

    await listarPlanosEnviados();

    expect(mockFindManyPlano).toHaveBeenCalledWith({
      where: { parceriaId: "parceria-1" },
      orderBy: { enviadoEm: "desc" },
      include: { cliente: { select: { id: true, name: true, email: true } } },
    });
  });
});
