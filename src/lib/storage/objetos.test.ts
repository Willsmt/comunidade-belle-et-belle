import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";

const { mockObterR2Client, mockObterNomeBucket } = vi.hoisted(() => ({
  mockObterR2Client: vi.fn(),
  mockObterNomeBucket: vi.fn(),
}));

vi.mock("./r2", () => ({
  obterR2Client: mockObterR2Client,
  obterNomeBucket: mockObterNomeBucket,
}));

import {
  apagarObjetoEmMelhorEsforco,
  gerarUrlAssinada,
  gerarUrlAssinadaCacheavel,
} from "./objetos";

describe("gerarUrlAssinadaCacheavel", () => {
  beforeEach(() => {
    mockObterR2Client.mockReset().mockReturnValue(
      new S3Client({
        region: "auto",
        endpoint: "https://conta-falsa.r2.cloudflarestorage.com",
        credentials: {
          accessKeyId: "AKIAFALSO",
          secretAccessKey: "segredo-falso",
        },
      }),
    );
    mockObterNomeBucket.mockReset().mockReturnValue("bucket-falso");
  });

  it("gera exatamente a mesma URL para chamadas na mesma janela de 1h", async () => {
    const a = await gerarUrlAssinadaCacheavel(
      "fotos/a.webp",
      new Date("2026-03-01T10:01:00Z"),
    );
    const b = await gerarUrlAssinadaCacheavel(
      "fotos/a.webp",
      new Date("2026-03-01T10:59:59Z"),
    );

    expect(a).toBe(b);
  });

  it("gera URLs diferentes em janelas diferentes", async () => {
    const a = await gerarUrlAssinadaCacheavel(
      "fotos/a.webp",
      new Date("2026-03-01T10:59:59Z"),
    );
    const b = await gerarUrlAssinadaCacheavel(
      "fotos/a.webp",
      new Date("2026-03-01T11:00:00Z"),
    );

    expect(a).not.toBe(b);
  });

  it("expira em 7200s e assina a partir do início da janela", async () => {
    const url = await gerarUrlAssinadaCacheavel(
      "fotos/a.webp",
      new Date("2026-03-01T10:30:00Z"),
    );

    expect(url).toContain("X-Amz-Expires=7200");
    expect(url).toContain("X-Amz-Date=20260301T100000Z");
  });

  it("gerarUrlAssinada continua efêmera (300s)", async () => {
    const url = await gerarUrlAssinada("fotos/a.webp");

    expect(url).toContain("X-Amz-Expires=300");
  });
});

describe("apagarObjetoEmMelhorEsforco", () => {
  const mockSend = vi.fn();

  beforeEach(() => {
    mockSend.mockReset();
    mockObterR2Client.mockReset().mockReturnValue({ send: mockSend });
    mockObterNomeBucket.mockReset().mockReturnValue("bucket-falso");
  });

  it("apaga o objeto no bucket e não loga nada em caso de sucesso", async () => {
    mockSend.mockResolvedValue({});
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await apagarObjetoEmMelhorEsforco("fotos/a.webp", "teste");

    expect(mockSend).toHaveBeenCalledTimes(1);
    const comando = mockSend.mock.calls[0][0];
    expect(comando).toBeInstanceOf(DeleteObjectCommand);
    expect(comando.input).toEqual({ Bucket: "bucket-falso", Key: "fotos/a.webp" });
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("em caso de falha só loga contexto e chave, sem relançar", async () => {
    const erro = new Error("R2 fora do ar");
    mockSend.mockRejectedValue(erro);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      apagarObjetoEmMelhorEsforco("fotos/a.webp", "meuContexto"),
    ).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("meuContexto"),
      "fotos/a.webp",
      erro,
    );
    consoleSpy.mockRestore();
  });

  it("também não relança se o client do R2 não puder ser criado (ex.: variável ausente)", async () => {
    mockObterR2Client.mockImplementation(() => {
      throw new Error("R2_BUCKET_NAME ausente");
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      apagarObjetoEmMelhorEsforco("fotos/a.webp", "ctx"),
    ).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    consoleSpy.mockRestore();
  });
});
