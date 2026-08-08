import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRequererPapel,
  mockFindUniqueVinculo,
  mockCreate,
  mockRevalidatePath,
  mockUploadPlano,
} = vi.hoisted(() => ({
  mockRequererPapel: vi.fn(),
  mockFindUniqueVinculo: vi.fn(),
  mockCreate: vi.fn(),
  mockRevalidatePath: vi.fn(),
  mockUploadPlano: vi.fn(),
}));

vi.mock("@/lib/auth/requerer-acesso-painel", () => ({
  requererPapel: mockRequererPapel,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    vinculoParceria: { findUnique: mockFindUniqueVinculo },
    planoRecebido: { create: mockCreate },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
vi.mock("@/lib/storage/planos", () => ({ uploadPlano: mockUploadPlano }));

import { enviarPlano } from "./actions";

function buildArquivo() {
  return new File(["conteudo"], "plano.pdf", { type: "application/pdf" });
}

function buildFormData(campos: Record<string, string>, arquivo?: File) {
  const formData = new FormData();
  for (const [chave, valor] of Object.entries(campos)) {
    formData.set(chave, valor);
  }
  if (arquivo) {
    formData.set("arquivo", arquivo);
  }
  return formData;
}

describe("enviarPlano", () => {
  beforeEach(() => {
    mockRequererPapel.mockReset();
    mockFindUniqueVinculo.mockReset();
    mockCreate.mockReset();
    mockRevalidatePath.mockReset();
    mockUploadPlano.mockReset();
  });

  it("exige o papel PARCERIA", async () => {
    mockRequererPapel.mockRejectedValue(new Error("Acesso negado"));

    await expect(
      enviarPlano(
        buildFormData({ clienteId: "c1", tipo: "TREINO" }, buildArquivo()),
      ),
    ).rejects.toThrow("Acesso negado");
    expect(mockUploadPlano).not.toHaveBeenCalled();
  });

  it("rejeita sem clienteId", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "parceria-1" } });

    await expect(
      enviarPlano(buildFormData({ tipo: "TREINO" }, buildArquivo())),
    ).rejects.toThrow("Selecione a cliente");
  });

  it("rejeita tipo inválido", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "parceria-1" } });

    await expect(
      enviarPlano(
        buildFormData({ clienteId: "c1", tipo: "INVALIDO" }, buildArquivo()),
      ),
    ).rejects.toThrow("Selecione o tipo do plano");
  });

  it("rejeita sem arquivo", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "parceria-1" } });

    await expect(
      enviarPlano(buildFormData({ clienteId: "c1", tipo: "TREINO" })),
    ).rejects.toThrow("Selecione um arquivo PDF");
  });

  it("rejeita se a cliente não está vinculada a essa parceria", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "parceria-1" } });
    mockFindUniqueVinculo.mockResolvedValue(null);

    await expect(
      enviarPlano(
        buildFormData({ clienteId: "c1", tipo: "TREINO" }, buildArquivo()),
      ),
    ).rejects.toThrow("Cliente não vinculada a você");
    expect(mockUploadPlano).not.toHaveBeenCalled();
  });

  it("rejeita se o vínculo existe mas está inativo", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "parceria-1" } });
    mockFindUniqueVinculo.mockResolvedValue({ ativo: false });

    await expect(
      enviarPlano(
        buildFormData({ clienteId: "c1", tipo: "TREINO" }, buildArquivo()),
      ),
    ).rejects.toThrow("Cliente não vinculada a você");
    expect(mockUploadPlano).not.toHaveBeenCalled();
  });

  it("envia e cria o registro com parceriaId da sessão e título null quando vazio", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "parceria-1" } });
    mockFindUniqueVinculo.mockResolvedValue({ ativo: true });
    mockUploadPlano.mockResolvedValue("planos/c1/abc.pdf");
    mockCreate.mockResolvedValue({});

    await enviarPlano(
      buildFormData({ clienteId: "c1", tipo: "DIETA" }, buildArquivo()),
    );

    expect(mockFindUniqueVinculo).toHaveBeenCalledWith({
      where: {
        clienteId_parceriaId: { clienteId: "c1", parceriaId: "parceria-1" },
      },
    });
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        clienteId: "c1",
        parceriaId: "parceria-1",
        tipo: "DIETA",
        titulo: null,
        arquivoChave: "planos/c1/abc.pdf",
      },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/parceria/planos");
  });

  it("salva o título quando preenchido", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "parceria-1" } });
    mockFindUniqueVinculo.mockResolvedValue({ ativo: true });
    mockUploadPlano.mockResolvedValue("planos/c1/abc.pdf");
    mockCreate.mockResolvedValue({});

    await enviarPlano(
      buildFormData(
        { clienteId: "c1", tipo: "TREINO", titulo: "  Fase 2  " },
        buildArquivo(),
      ),
    );

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ titulo: "Fase 2" }) }),
    );
  });
});
