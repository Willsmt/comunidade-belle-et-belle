import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFotoCount, mockPostCount, mockPlanoCount } = vi.hoisted(() => ({
  mockFotoCount: vi.fn(),
  mockPostCount: vi.fn(),
  mockPlanoCount: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    fotoEvolucao: { count: mockFotoCount },
    post: { count: mockPostCount },
    planoRecebido: { count: mockPlanoCount },
  },
}));

import {
  garantirCotaFotosEvolucao,
  garantirCotaPlanos,
  garantirCotaPostsComImagem,
} from "./cotas";

const AGORA = new Date("2026-05-10T12:00:00.000Z");
const VINTE_E_QUATRO_HORAS_ATRAS = new Date("2026-05-09T12:00:00.000Z");

beforeEach(() => {
  mockFotoCount.mockReset();
  mockPostCount.mockReset();
  mockPlanoCount.mockReset();
});

describe("garantirCotaFotosEvolucao", () => {
  it("passa abaixo do limite, contando só as fotos da cliente", async () => {
    mockFotoCount.mockResolvedValue(99);

    await expect(garantirCotaFotosEvolucao("c1")).resolves.toBeUndefined();
    expect(mockFotoCount).toHaveBeenCalledWith({ where: { clienteId: "c1" } });
  });

  it("lança no limite", async () => {
    mockFotoCount.mockResolvedValue(100);

    await expect(garantirCotaFotosEvolucao("c1")).rejects.toThrow(
      "Você atingiu o limite de 100 fotos. Exclua fotos antigas para enviar novas.",
    );
  });
});

describe("garantirCotaPostsComImagem", () => {
  it("passa abaixo do limite", async () => {
    mockPostCount.mockResolvedValue(9);

    await expect(
      garantirCotaPostsComImagem("a1", AGORA),
    ).resolves.toBeUndefined();
  });

  it("lança no limite", async () => {
    mockPostCount.mockResolvedValue(10);

    await expect(garantirCotaPostsComImagem("a1", AGORA)).rejects.toThrow(
      "Você atingiu o limite de 10 posts com imagem nas últimas 24 horas. Tente novamente mais tarde.",
    );
  });

  it("conta só posts com upload (imagemChave e sem fotoEvolucaoId) na janela móvel de 24h", async () => {
    mockPostCount.mockResolvedValue(0);

    await garantirCotaPostsComImagem("a1", AGORA);

    expect(mockPostCount).toHaveBeenCalledWith({
      where: {
        autorId: "a1",
        imagemChave: { not: null },
        fotoEvolucaoId: null,
        criadoEm: { gte: VINTE_E_QUATRO_HORAS_ATRAS },
      },
    });
  });
});

describe("garantirCotaPlanos", () => {
  it("passa abaixo do limite", async () => {
    mockPlanoCount.mockResolvedValue(4);

    await expect(garantirCotaPlanos("p1", AGORA)).resolves.toBeUndefined();
  });

  it("lança no limite", async () => {
    mockPlanoCount.mockResolvedValue(5);

    await expect(garantirCotaPlanos("p1", AGORA)).rejects.toThrow(
      "Você atingiu o limite de 5 planos enviados nas últimas 24 horas. Tente novamente mais tarde.",
    );
  });

  it("usa a janela de 24h sobre enviadoEm, filtrando pela parceria", async () => {
    mockPlanoCount.mockResolvedValue(0);

    await garantirCotaPlanos("p1", AGORA);

    expect(mockPlanoCount).toHaveBeenCalledWith({
      where: { parceriaId: "p1", enviadoEm: { gte: VINTE_E_QUATRO_HORAS_ATRAS } },
    });
  });
});
