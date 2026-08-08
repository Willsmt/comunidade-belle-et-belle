import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequererPapel, mockUpsert, mockRevalidatePath } = vi.hoisted(() => ({
  mockRequererPapel: vi.fn(),
  mockUpsert: vi.fn(),
  mockRevalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth/requerer-acesso-painel", () => ({
  requererPapel: mockRequererPapel,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { perfil: { upsert: mockUpsert } },
}));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));

import { atualizarPerfil } from "./actions";

function buildFormData(campos: Record<string, string>) {
  const formData = new FormData();
  for (const [chave, valor] of Object.entries(campos)) {
    formData.set(chave, valor);
  }
  return formData;
}

describe("atualizarPerfil", () => {
  beforeEach(() => {
    mockRequererPapel.mockReset();
    mockUpsert.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("exige o papel CLIENTE e não salva nada se o acesso for negado", async () => {
    mockRequererPapel.mockRejectedValue(new Error("Acesso negado"));

    await expect(
      atualizarPerfil(buildFormData({ bio: "oi" })),
    ).rejects.toThrow("Acesso negado");

    expect(mockRequererPapel).toHaveBeenCalledWith(["CLIENTE"]);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("salva bio null quando o campo vem vazio, e todos os toggles como false quando ausentes", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "cliente-1" } });
    mockUpsert.mockResolvedValue({});

    await atualizarPerfil(buildFormData({ bio: "   " }));

    expect(mockUpsert).toHaveBeenCalledWith({
      where: { userId: "cliente-1" },
      create: {
        userId: "cliente-1",
        bio: null,
        bioPublica: false,
        emblemasPublicos: false,
        medidasPublicas: false,
      },
      update: {
        bio: null,
        bioPublica: false,
        emblemasPublicos: false,
        medidasPublicas: false,
      },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/cliente/perfil");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/perfil/cliente-1");
  });

  it("salva bio preenchida e toggles marcados como 'on'", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "cliente-1" } });
    mockUpsert.mockResolvedValue({});

    await atualizarPerfil(
      buildFormData({
        bio: "  Oi, sou eu  ",
        bioPublica: "on",
        emblemasPublicos: "on",
        medidasPublicas: "on",
      }),
    );

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          bio: "Oi, sou eu",
          bioPublica: true,
          emblemasPublicos: true,
          medidasPublicas: true,
        }),
      }),
    );
  });
});
