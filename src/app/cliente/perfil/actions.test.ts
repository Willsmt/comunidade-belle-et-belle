import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRequererPapel,
  mockUpsert,
  mockFindUnique,
  mockUpdateUser,
  mockRevalidatePath,
  mockUploadFotoPerfil,
  mockDeletarFotoPerfil,
} = vi.hoisted(() => ({
  mockRequererPapel: vi.fn(),
  mockUpsert: vi.fn(),
  mockFindUnique: vi.fn(),
  mockUpdateUser: vi.fn(),
  mockRevalidatePath: vi.fn(),
  mockUploadFotoPerfil: vi.fn(),
  mockDeletarFotoPerfil: vi.fn(),
}));

vi.mock("@/lib/auth/requerer-acesso-painel", () => ({
  requererPapel: mockRequererPapel,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    perfil: { upsert: mockUpsert, findUnique: mockFindUnique },
    user: { update: mockUpdateUser },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
vi.mock("@/lib/storage/perfil", () => ({
  uploadFotoPerfil: mockUploadFotoPerfil,
  deletarFotoPerfil: mockDeletarFotoPerfil,
}));

import { atualizarPerfil } from "./actions";

function buildFormData(campos: Record<string, string | File>) {
  const formData = new FormData();
  for (const [chave, valor] of Object.entries(campos)) {
    formData.set(chave, valor as string & File);
  }
  return formData;
}

function buildArquivo(tamanho = 1024) {
  return new File([new Uint8Array(tamanho)], "foto.webp", {
    type: "image/webp",
  });
}

describe("atualizarPerfil", () => {
  beforeEach(() => {
    mockRequererPapel.mockReset();
    mockUpsert.mockReset();
    mockFindUnique.mockReset();
    mockUpdateUser.mockReset();
    mockRevalidatePath.mockReset();
    mockUploadFotoPerfil.mockReset();
    mockDeletarFotoPerfil.mockReset();
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
    mockFindUnique.mockResolvedValue(null);
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
        fotoChave: null,
      },
      update: {
        bio: null,
        bioPublica: false,
        emblemasPublicos: false,
        medidasPublicas: false,
      },
    });
    expect(mockUpdateUser).not.toHaveBeenCalled();
    expect(mockRevalidatePath).toHaveBeenCalledWith("/cliente/perfil");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/perfil/cliente-1");
  });

  it("salva bio preenchida e toggles marcados como 'on'", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindUnique.mockResolvedValue(null);
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

  it("salva o nome de exibição quando preenchido", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindUnique.mockResolvedValue(null);
    mockUpsert.mockResolvedValue({});
    mockUpdateUser.mockResolvedValue({});

    await atualizarPerfil(buildFormData({ nome: "  Novo Nome  " }));

    expect(mockUpdateUser).toHaveBeenCalledWith({
      where: { id: "cliente-1" },
      data: { name: "Novo Nome" },
    });
  });

  it("não mexe no nome quando o campo vem vazio", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindUnique.mockResolvedValue(null);
    mockUpsert.mockResolvedValue({});

    await atualizarPerfil(buildFormData({ nome: "   " }));

    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("com foto nova e sem perfil anterior: envia pro storage e não tenta deletar nada", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindUnique.mockResolvedValue(null);
    mockUploadFotoPerfil.mockResolvedValue("perfis-cliente/cliente-1/nova.webp");
    mockUpsert.mockResolvedValue({});

    await atualizarPerfil(buildFormData({ foto: buildArquivo() }));

    expect(mockUploadFotoPerfil).toHaveBeenCalledWith(
      expect.any(File),
      "cliente-1",
    );
    expect(mockDeletarFotoPerfil).not.toHaveBeenCalled();
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          fotoChave: "perfis-cliente/cliente-1/nova.webp",
        }),
        update: expect.objectContaining({
          fotoChave: "perfis-cliente/cliente-1/nova.webp",
        }),
      }),
    );
  });

  it("com foto nova substituindo uma existente: deleta a chave antiga do storage", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindUnique.mockResolvedValue({
      fotoChave: "perfis-cliente/cliente-1/antiga.webp",
    });
    mockUploadFotoPerfil.mockResolvedValue("perfis-cliente/cliente-1/nova.webp");
    mockUpsert.mockResolvedValue({});

    await atualizarPerfil(buildFormData({ foto: buildArquivo() }));

    expect(mockDeletarFotoPerfil).toHaveBeenCalledWith(
      "perfis-cliente/cliente-1/antiga.webp",
    );
  });

  it("sem foto nova: mantém a fotoChave existente intocada no update", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindUnique.mockResolvedValue({
      fotoChave: "perfis-cliente/cliente-1/antiga.webp",
    });
    mockUpsert.mockResolvedValue({});

    await atualizarPerfil(buildFormData({ bio: "atualizando só a bio" }));

    expect(mockUploadFotoPerfil).not.toHaveBeenCalled();
    expect(mockDeletarFotoPerfil).not.toHaveBeenCalled();
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: {
          bio: "atualizando só a bio",
          bioPublica: false,
          emblemasPublicos: false,
          medidasPublicas: false,
        },
      }),
    );
  });
});
