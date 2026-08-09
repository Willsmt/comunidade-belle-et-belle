import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRequererPapel,
  mockUpsert,
  mockFindUnique,
  mockRevalidatePath,
  mockUploadFotoParceria,
  mockDeletarFotoParceria,
} = vi.hoisted(() => ({
  mockRequererPapel: vi.fn(),
  mockUpsert: vi.fn(),
  mockFindUnique: vi.fn(),
  mockRevalidatePath: vi.fn(),
  mockUploadFotoParceria: vi.fn(),
  mockDeletarFotoParceria: vi.fn(),
}));

vi.mock("@/lib/auth/requerer-acesso-painel", () => ({
  requererPapel: mockRequererPapel,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    perfilParceria: { upsert: mockUpsert, findUnique: mockFindUnique },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
vi.mock("@/lib/storage/parcerias", () => ({
  uploadFotoParceria: mockUploadFotoParceria,
  deletarFotoParceria: mockDeletarFotoParceria,
}));

import { atualizarPerfilParceria } from "./actions";

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

describe("atualizarPerfilParceria", () => {
  beforeEach(() => {
    mockRequererPapel.mockReset();
    mockUpsert.mockReset();
    mockFindUnique.mockReset();
    mockRevalidatePath.mockReset();
    mockUploadFotoParceria.mockReset();
    mockDeletarFotoParceria.mockReset();
  });

  it("exige o papel PARCERIA e não salva nada se o acesso for negado", async () => {
    mockRequererPapel.mockRejectedValue(new Error("Acesso negado"));

    await expect(
      atualizarPerfilParceria(buildFormData({ bio: "oi" })),
    ).rejects.toThrow("Acesso negado");

    expect(mockRequererPapel).toHaveBeenCalledWith(["PARCERIA"]);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("salva especialidade e bio null quando os campos vêm vazios, sem mexer na foto", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "parceria-1" } });
    mockFindUnique.mockResolvedValue(null);
    mockUpsert.mockResolvedValue({});

    await atualizarPerfilParceria(
      buildFormData({ especialidade: "  ", bio: "  " }),
    );

    expect(mockUploadFotoParceria).not.toHaveBeenCalled();
    expect(mockDeletarFotoParceria).not.toHaveBeenCalled();
    expect(mockUpsert).toHaveBeenCalledWith({
      where: { usuarioId: "parceria-1" },
      create: {
        usuarioId: "parceria-1",
        especialidade: null,
        bio: null,
        fotoChave: null,
      },
      update: {
        especialidade: null,
        bio: null,
      },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/parceria/perfil");
  });

  it("salva especialidade e bio preenchidos", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "parceria-1" } });
    mockFindUnique.mockResolvedValue(null);
    mockUpsert.mockResolvedValue({});

    await atualizarPerfilParceria(
      buildFormData({ especialidade: "  Nutricionista  ", bio: "  Oi  " }),
    );

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          especialidade: "Nutricionista",
          bio: "Oi",
        }),
      }),
    );
  });

  it("com foto nova e sem perfil anterior: envia pro storage e não tenta deletar nada", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "parceria-1" } });
    mockFindUnique.mockResolvedValue(null);
    mockUploadFotoParceria.mockResolvedValue(
      "perfis-parceria/parceria-1/nova.webp",
    );
    mockUpsert.mockResolvedValue({});

    await atualizarPerfilParceria(buildFormData({ foto: buildArquivo() }));

    expect(mockUploadFotoParceria).toHaveBeenCalledWith(
      expect.any(File),
      "parceria-1",
    );
    expect(mockDeletarFotoParceria).not.toHaveBeenCalled();
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          fotoChave: "perfis-parceria/parceria-1/nova.webp",
        }),
        update: expect.objectContaining({
          fotoChave: "perfis-parceria/parceria-1/nova.webp",
        }),
      }),
    );
  });

  it("com foto nova substituindo uma existente: deleta a chave antiga do storage", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "parceria-1" } });
    mockFindUnique.mockResolvedValue({
      fotoChave: "perfis-parceria/parceria-1/antiga.webp",
    });
    mockUploadFotoParceria.mockResolvedValue(
      "perfis-parceria/parceria-1/nova.webp",
    );
    mockUpsert.mockResolvedValue({});

    await atualizarPerfilParceria(buildFormData({ foto: buildArquivo() }));

    expect(mockDeletarFotoParceria).toHaveBeenCalledWith(
      "perfis-parceria/parceria-1/antiga.webp",
    );
  });

  it("sem foto nova: mantém a fotoChave existente intocada no update", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "parceria-1" } });
    mockFindUnique.mockResolvedValue({
      fotoChave: "perfis-parceria/parceria-1/antiga.webp",
    });
    mockUpsert.mockResolvedValue({});

    await atualizarPerfilParceria(
      buildFormData({ bio: "atualizando só a bio" }),
    );

    expect(mockUploadFotoParceria).not.toHaveBeenCalled();
    expect(mockDeletarFotoParceria).not.toHaveBeenCalled();
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { especialidade: null, bio: "atualizando só a bio" },
      }),
    );
  });
});
