import { beforeEach, describe, expect, it, vi } from "vitest";
import { S3Client } from "@aws-sdk/client-s3";

const { mockObterR2Client, mockObterNomeBucket } = vi.hoisted(() => ({
  mockObterR2Client: vi.fn(),
  mockObterNomeBucket: vi.fn(),
}));

vi.mock("./r2", () => ({
  obterR2Client: mockObterR2Client,
  obterNomeBucket: mockObterNomeBucket,
}));

import { gerarUrlAssinada, gerarUrlAssinadaCacheavel } from "./objetos";

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
