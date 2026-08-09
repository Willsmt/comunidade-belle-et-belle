import { beforeEach, describe, expect, it, vi } from "vitest";
const { mockAuth, mockFindMany, mockGerarUrlAssinada } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockFindMany: vi.fn(),
  mockGerarUrlAssinada: vi.fn(),
}));
vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/prisma", () => ({
  prisma: { vinculoParceria: { findMany: mockFindMany } },
}));
vi.mock("@/lib/storage/parcerias", () => ({
  gerarUrlAssinada: mockGerarUrlAssinada,
}));
import { listarParceriasVinculadas } from "./queries";

describe("listarParceriasVinculadas", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockFindMany.mockReset();
    mockGerarUrlAssinada.mockReset();
  });

  it("lança erro se não houver sessão", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(listarParceriasVinculadas()).rejects.toThrow(
      "Sessão inválida",
    );
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("busca só os vínculos ativos da cliente logada, com signed URL quando há foto", async () => {
    mockAuth.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindMany.mockResolvedValue([
      {
        parceria: {
          id: "parceria-1",
          name: "Fulana Nutri",
          email: "fulana@x.com",
          perfilParceria: {
            especialidade: "Nutrição",
            bio: "Cuido de dieta",
            fotoChave: "perfis-parceria/parceria-1/foto.webp",
          },
        },
      },
    ]);
    mockGerarUrlAssinada.mockResolvedValue("https://url-assinada.exemplo");

    const resultado = await listarParceriasVinculadas();

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { clienteId: "cliente-1", ativo: true },
      orderBy: { criadoEm: "asc" },
      include: {
        parceria: {
          select: { id: true, name: true, email: true, perfilParceria: true },
        },
      },
    });
    expect(resultado).toEqual([
      {
        id: "parceria-1",
        nome: "Fulana Nutri",
        especialidade: "Nutrição",
        bio: "Cuido de dieta",
        fotoUrl: "https://url-assinada.exemplo",
      },
    ]);
  });

  it("usa o email como nome quando não há name, e não chama signed URL sem fotoChave", async () => {
    mockAuth.mockResolvedValue({ user: { id: "cliente-1" } });
    mockFindMany.mockResolvedValue([
      {
        parceria: {
          id: "parceria-2",
          name: null,
          email: "parceria2@x.com",
          perfilParceria: null,
        },
      },
    ]);

    const resultado = await listarParceriasVinculadas();

    expect(mockGerarUrlAssinada).not.toHaveBeenCalled();
    expect(resultado[0]).toEqual({
      id: "parceria-2",
      nome: "parceria2@x.com",
      especialidade: null,
      bio: null,
      fotoUrl: null,
    });
  });
});
