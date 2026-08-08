import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockFindUniqueUser, mockFindFirstMedida } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockFindUniqueUser: vi.fn(),
  mockFindFirstMedida: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: mockFindUniqueUser },
    registroMedida: { findFirst: mockFindFirstMedida },
  },
}));

import { obterPerfilPublico } from "./queries";

describe("obterPerfilPublico", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockFindUniqueUser.mockReset();
    mockFindFirstMedida.mockReset();
  });

  it("lança erro se não houver sessão", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(obterPerfilPublico("cliente-1")).rejects.toThrow(
      "Sessão inválida",
    );
  });

  it("retorna null se o usuário não existir", async () => {
    mockAuth.mockResolvedValue({ user: { id: "viewer-1" } });
    mockFindUniqueUser.mockResolvedValue(null);

    const resultado = await obterPerfilPublico("nao-existe");

    expect(resultado).toBeNull();
    expect(mockFindFirstMedida).not.toHaveBeenCalled();
  });

  it("omite bio quando bioPublica é false, mesmo com bio preenchida", async () => {
    mockAuth.mockResolvedValue({ user: { id: "viewer-1" } });
    mockFindUniqueUser.mockResolvedValue({
      name: "Cliente 1",
      perfil: {
        bio: "segredo",
        bioPublica: false,
        emblemasPublicos: true,
        medidasPublicas: false,
      },
    });

    const resultado = await obterPerfilPublico("cliente-1");

    expect(resultado?.bio).toBeNull();
    expect(mockFindFirstMedida).not.toHaveBeenCalled();
  });

  it("busca a última medida só quando medidasPublicas é true", async () => {
    mockAuth.mockResolvedValue({ user: { id: "viewer-1" } });
    mockFindUniqueUser.mockResolvedValue({
      name: "Cliente 1",
      perfil: {
        bio: null,
        bioPublica: false,
        emblemasPublicos: true,
        medidasPublicas: true,
      },
    });
    mockFindFirstMedida.mockResolvedValue({ id: "medida-1", peso: 60 });

    const resultado = await obterPerfilPublico("cliente-1");

    expect(mockFindFirstMedida).toHaveBeenCalledWith({
      where: { clienteId: "cliente-1" },
      orderBy: { data: "desc" },
    });
    expect(resultado?.ultimaMedida).toEqual({ id: "medida-1", peso: 60 });
  });

  it("usuário sem Perfil ainda: retorna defaults seguros sem quebrar", async () => {
    mockAuth.mockResolvedValue({ user: { id: "viewer-1" } });
    mockFindUniqueUser.mockResolvedValue({ name: "Cliente novo", perfil: null });

    const resultado = await obterPerfilPublico("cliente-1");

    expect(resultado).toEqual({
      nome: "Cliente novo",
      bio: null,
      emblemasPublicos: false,
      ultimaMedida: null,
    });
  });
});
