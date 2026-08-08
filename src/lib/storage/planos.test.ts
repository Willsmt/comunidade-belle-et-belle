import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockUploadObjeto, mockGetSignedUrl, mockObterR2Client, mockObterNomeBucket } =
  vi.hoisted(() => ({
    mockUploadObjeto: vi.fn(),
    mockGetSignedUrl: vi.fn(),
    mockObterR2Client: vi.fn(),
    mockObterNomeBucket: vi.fn(),
  }));

vi.mock("./objetos", async () => {
  const actual = await vi.importActual<typeof import("./objetos")>("./objetos");
  return { ...actual, uploadObjeto: mockUploadObjeto };
});
vi.mock("./r2", () => ({
  obterR2Client: mockObterR2Client,
  obterNomeBucket: mockObterNomeBucket,
}));
vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: mockGetSignedUrl,
}));

import { validarArquivoPdf, uploadPlano } from "./planos";

function buildArquivo(overrides: Partial<{ type: string; size: number }> = {}) {
  const type = overrides.type ?? "application/pdf";
  const size = overrides.size ?? 1024;
  return {
    type,
    size,
    arrayBuffer: async () => new ArrayBuffer(size),
  } as File;
}

describe("validarArquivoPdf", () => {
  it("aceita PDF dentro do limite", () => {
    expect(() => validarArquivoPdf(buildArquivo())).not.toThrow();
  });

  it("rejeita formato não-PDF", () => {
    expect(() =>
      validarArquivoPdf(buildArquivo({ type: "image/jpeg" })),
    ).toThrow("Formato inválido");
  });

  it("rejeita arquivo maior que 10MB", () => {
    expect(() =>
      validarArquivoPdf(buildArquivo({ size: 10 * 1024 * 1024 + 1 })),
    ).toThrow("Arquivo muito grande");
  });
});

describe("uploadPlano", () => {
  beforeEach(() => {
    mockUploadObjeto.mockReset().mockResolvedValue(undefined);
  });

  it("valida antes de enviar e gera chave prefixada pelo clienteId", async () => {
    const chave = await uploadPlano(buildArquivo(), "cliente-1");

    expect(mockUploadObjeto).toHaveBeenCalledWith(
      expect.stringMatching(/^planos\/cliente-1\/.+\.pdf$/),
      expect.anything(),
      "application/pdf",
    );
    expect(chave).toMatch(/^planos\/cliente-1\/.+\.pdf$/);
  });

  it("rejeita arquivo inválido sem chamar upload", async () => {
    await expect(
      uploadPlano(buildArquivo({ type: "image/png" }), "cliente-1"),
    ).rejects.toThrow("Formato inválido");

    expect(mockUploadObjeto).not.toHaveBeenCalled();
  });
});
