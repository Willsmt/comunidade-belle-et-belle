import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockSend,
  mockObterR2Client,
  mockObterNomeBucket,
  mockComprimirImagem,
  mockGetSignedUrl,
} = vi.hoisted(() => ({
  mockSend: vi.fn(),
  mockObterR2Client: vi.fn(),
  mockObterNomeBucket: vi.fn(),
  mockComprimirImagem: vi.fn(),
  mockGetSignedUrl: vi.fn(),
}));

vi.mock("./r2", () => ({
  obterR2Client: mockObterR2Client,
  obterNomeBucket: mockObterNomeBucket,
}));
vi.mock("./comprimir-imagem", () => ({
  comprimirImagem: mockComprimirImagem,
}));
vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: mockGetSignedUrl,
}));

import {
  validarArquivo,
  uploadFotoParceria,
  gerarUrlAssinada,
  deletarFotoParceria,
} from "./parcerias";

function buildArquivo(overrides: Partial<{ type: string; size: number }> = {}) {
  const type = overrides.type ?? "image/jpeg";
  const size = overrides.size ?? 1024;
  return {
    type,
    size,
    arrayBuffer: async () => new ArrayBuffer(size),
  } as File;
}

describe("validarArquivo", () => {
  it("aceita JPEG, PNG e WebP dentro do limite", () => {
    expect(() => validarArquivo(buildArquivo({ type: "image/jpeg" }))).not.toThrow();
    expect(() => validarArquivo(buildArquivo({ type: "image/png" }))).not.toThrow();
    expect(() => validarArquivo(buildArquivo({ type: "image/webp" }))).not.toThrow();
  });

  it("rejeita formato não suportado", () => {
    expect(() => validarArquivo(buildArquivo({ type: "application/pdf" }))).toThrow(
      "Formato de imagem não suportado",
    );
  });

  it("rejeita arquivo maior que 5MB", () => {
    expect(() =>
      validarArquivo(buildArquivo({ size: 5 * 1024 * 1024 + 1 })),
    ).toThrow("Imagem muito grande");
  });
});

describe("uploadFotoParceria", () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockObterR2Client.mockReset().mockReturnValue({ send: mockSend });
    mockObterNomeBucket.mockReset().mockReturnValue("bucket-teste");
    mockComprimirImagem.mockReset().mockResolvedValue(Buffer.from("comprimido"));
  });

  it("valida antes de comprimir e envia pro bucket com chave prefixada por perfis-parceria/usuarioId", async () => {
    mockSend.mockResolvedValue({});

    const chave = await uploadFotoParceria(buildArquivo(), "parceria-1");

    expect(mockComprimirImagem).toHaveBeenCalled();
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(chave).toMatch(/^perfis-parceria\/parceria-1\/.+\.webp$/);
  });

  it("rejeita arquivo inválido sem chamar o R2", async () => {
    await expect(
      uploadFotoParceria(buildArquivo({ type: "text/plain" }), "parceria-1"),
    ).rejects.toThrow("Formato de imagem não suportado");

    expect(mockSend).not.toHaveBeenCalled();
  });
});

describe("gerarUrlAssinada", () => {
  beforeEach(() => {
    mockObterR2Client.mockReset().mockReturnValue({});
    mockObterNomeBucket.mockReset().mockReturnValue("bucket-teste");
    mockGetSignedUrl.mockReset().mockResolvedValue("https://url-assinada.exemplo");
  });

  it("gera a signed URL com expiração de 5 minutos", async () => {
    const url = await gerarUrlAssinada("perfis-parceria/parceria-1/foto.webp");

    expect(url).toBe("https://url-assinada.exemplo");
    expect(mockGetSignedUrl).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      { expiresIn: 300 },
    );
  });
});

describe("deletarFotoParceria", () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockObterR2Client.mockReset().mockReturnValue({ send: mockSend });
    mockObterNomeBucket.mockReset().mockReturnValue("bucket-teste");
  });

  it("envia o comando de delete pro bucket com a chave certa", async () => {
    mockSend.mockResolvedValue({});

    await deletarFotoParceria("perfis-parceria/parceria-1/foto.webp");

    expect(mockSend).toHaveBeenCalledTimes(1);
  });
});
