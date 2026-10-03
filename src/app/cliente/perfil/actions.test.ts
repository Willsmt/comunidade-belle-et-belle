import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRequererPapel,
  mockUpsert,
  mockFindUnique,
  mockUpdateUser,
  mockRevalidatePath,
  mockUploadFotoPerfil,
  mockApagarObjeto,
} = vi.hoisted(() => ({
  mockRequererPapel: vi.fn(),
  mockUpsert: vi.fn(),
  mockFindUnique: vi.fn(),
  mockUpdateUser: vi.fn(),
  mockRevalidatePath: vi.fn(),
  mockUploadFotoPerfil: vi.fn(),
  mockApagarObjeto: vi.fn(),
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
}));
vi.mock("@/lib/storage/objetos", () => ({
  apagarObjetoEmMelhorEsforco: mockApagarObjeto,
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
    mockApagarObjeto.mockReset().mockResolvedValue(undefined);
  });

  it("exige o papel CLIENTE e não salva nada se o acesso for negado", async () => {
    mockRequererPapel.mockRejectedValue(new Error("Acesso negado"));

    await expect(
      atualizarPerfil(buildFormData({ bio: "oi" })),
    ).rejects.toThrow("Não foi possível concluir a ação.");

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
    expect(mockApagarObjeto).not.toHaveBeenCalled();
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

    expect(mockApagarObjeto).toHaveBeenCalledWith(
      "perfis-cliente/cliente-1/antiga.webp",
      expect.any(String),
    );
  });

  it("com foto nova: o upsert acontece antes de apagar a foto antiga", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindUnique.mockResolvedValue({
      fotoChave: "perfis-cliente/cliente-1/antiga.webp",
    });
    mockUploadFotoPerfil.mockResolvedValue("perfis-cliente/cliente-1/nova.webp");
    const ordem: string[] = [];
    mockUpsert.mockImplementation(async () => {
      ordem.push("banco");
    });
    mockApagarObjeto.mockImplementation(async () => {
      ordem.push("apagar-antiga");
    });

    await atualizarPerfil(buildFormData({ foto: buildArquivo() }));

    expect(ordem).toEqual(["banco", "apagar-antiga"]);
  });

  it("se o upsert falhar, apaga a foto NOVA, mantém a antiga e relança o erro original", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindUnique.mockResolvedValue({
      fotoChave: "perfis-cliente/cliente-1/antiga.webp",
    });
    mockUploadFotoPerfil.mockResolvedValue("perfis-cliente/cliente-1/nova.webp");
    mockUpsert.mockRejectedValue(new Error("falha no banco"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      atualizarPerfil(buildFormData({ foto: buildArquivo() })),
    ).rejects.toThrow("Não foi possível concluir a ação.");

    expect(mockApagarObjeto).toHaveBeenCalledTimes(1);
    expect(mockApagarObjeto).toHaveBeenCalledWith(
      "perfis-cliente/cliente-1/nova.webp",
      expect.any(String),
    );
    expect(mockRevalidatePath).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ message: "falha no banco" }),
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
    expect(mockApagarObjeto).not.toHaveBeenCalled();
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
