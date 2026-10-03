import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockUploadObjeto,
  mockGetSignedUrl,
  mockObterR2Client,
  mockObterNomeBucket,
  mockSend,
} = vi.hoisted(() => ({
  mockUploadObjeto: vi.fn(),
  mockGetSignedUrl: vi.fn(),
  mockObterR2Client: vi.fn(),
  mockObterNomeBucket: vi.fn(),
  mockSend: vi.fn(),
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

import { validarArquivoPdf, uploadPlano, deletarPlano } from "./planos";

function buildArquivo(
  overrides: Partial<{ type: string; size: number; conteudo: string }> = {},
) {
  const type = overrides.type ?? "application/pdf";
  const size = overrides.size ?? 1024;
  const conteudo = overrides.conteudo ?? "%PDF-1.7\n";
  return {
    type,
    size,
    arrayBuffer: async () => new TextEncoder().encode(conteudo).buffer,
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

  it("aceita PDF de exatamente 5MB", () => {
    expect(() =>
      validarArquivoPdf(buildArquivo({ size: 5 * 1024 * 1024 })),
    ).not.toThrow();
  });

  it("rejeita arquivo maior que 5MB", () => {
    expect(() =>
      validarArquivoPdf(buildArquivo({ size: 5 * 1024 * 1024 + 1 })),
    ).toThrow("Tamanho máximo: 5MB");
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

  it("rejeita type application/pdf sem a assinatura %PDF- sem chamar upload", async () => {
    await expect(
      uploadPlano(buildArquivo({ conteudo: "<html>não sou pdf</html>" }), "cliente-1"),
    ).rejects.toThrow("Arquivo não é um PDF válido.");

    expect(mockUploadObjeto).not.toHaveBeenCalled();
  });

  it("rejeita arquivo vazio sem chamar upload", async () => {
    await expect(
      uploadPlano(buildArquivo({ conteudo: "" }), "cliente-1"),
    ).rejects.toThrow("Arquivo não é um PDF válido.");

    expect(mockUploadObjeto).not.toHaveBeenCalled();
  });

  it("rejeita PDF acima de 5MB sem chamar upload", async () => {
    await expect(
      uploadPlano(buildArquivo({ size: 5 * 1024 * 1024 + 1 }), "cliente-1"),
    ).rejects.toThrow("Arquivo muito grande");

    expect(mockUploadObjeto).not.toHaveBeenCalled();
  });
});

describe("deletarPlano", () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockObterR2Client.mockReset().mockReturnValue({ send: mockSend });
    mockObterNomeBucket.mockReset().mockReturnValue("bucket-teste");
  });

  it("envia o comando de delete pro bucket com a chave certa", async () => {
    mockSend.mockResolvedValue({});

    await deletarPlano("planos/cliente-1/plano.pdf");

    expect(mockSend).toHaveBeenCalledTimes(1);
  });
});
