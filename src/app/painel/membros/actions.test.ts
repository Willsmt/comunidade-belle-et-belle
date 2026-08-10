import { beforeEach, describe, expect, it, vi } from "vitest";
const {
  mockRequererAcesso,
  mockUpdate,
  mockDelete,
  mockCount,
  mockUpsert,
  mockDeleteMany,
  mockUpdateManyVinculo,
  mockTransaction,
  mockRevalidatePath,
  mockFindUniquePerfil,
  mockFindUniquePerfilParceria,
  mockFindManyFotoEvolucao,
  mockFindManyJornadaDesafio,
  mockFindManyParticipacaoSurpresa,
  mockFindManyPost,
  mockFindManyPlanoRecebido,
  mockDeletarFoto,
  mockDeletarFotoPerfil,
  mockDeletarFotoParceria,
  mockDeletarFotoJornada,
  mockDeletarComprovante,
  mockDeletarImagemPost,
  mockDeletarPlano,
} = vi.hoisted(() => ({
  mockRequererAcesso: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
  mockCount: vi.fn(),
  mockUpsert: vi.fn(),
  mockDeleteMany: vi.fn(),
  mockUpdateManyVinculo: vi.fn(),
  mockTransaction: vi.fn(),
  mockRevalidatePath: vi.fn(),
  mockFindUniquePerfil: vi.fn(),
  mockFindUniquePerfilParceria: vi.fn(),
  mockFindManyFotoEvolucao: vi.fn(),
  mockFindManyJornadaDesafio: vi.fn(),
  mockFindManyParticipacaoSurpresa: vi.fn(),
  mockFindManyPost: vi.fn(),
  mockFindManyPlanoRecebido: vi.fn(),
  mockDeletarFoto: vi.fn(),
  mockDeletarFotoPerfil: vi.fn(),
  mockDeletarFotoParceria: vi.fn(),
  mockDeletarFotoJornada: vi.fn(),
  mockDeletarComprovante: vi.fn(),
  mockDeletarImagemPost: vi.fn(),
  mockDeletarPlano: vi.fn(),
}));
vi.mock("@/lib/auth/requerer-acesso-painel", () => ({
  requererAcessoPainel: mockRequererAcesso,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { update: mockUpdate, delete: mockDelete, count: mockCount },
    usuarioPapel: { upsert: mockUpsert, deleteMany: mockDeleteMany },
    vinculoParceria: { updateMany: mockUpdateManyVinculo },
    perfil: { findUnique: mockFindUniquePerfil },
    perfilParceria: { findUnique: mockFindUniquePerfilParceria },
    fotoEvolucao: { findMany: mockFindManyFotoEvolucao },
    jornadaDesafio: { findMany: mockFindManyJornadaDesafio },
    participacaoSurpresa: { findMany: mockFindManyParticipacaoSurpresa },
    post: { findMany: mockFindManyPost },
    planoRecebido: { findMany: mockFindManyPlanoRecebido },
    $transaction: mockTransaction,
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
vi.mock("@/lib/storage/fotos", () => ({ deletarFoto: mockDeletarFoto }));
vi.mock("@/lib/storage/perfil", () => ({
  deletarFotoPerfil: mockDeletarFotoPerfil,
}));
vi.mock("@/lib/storage/parcerias", () => ({
  deletarFotoParceria: mockDeletarFotoParceria,
}));
vi.mock("@/lib/storage/jornada-desafio", () => ({
  deletarFotoJornada: mockDeletarFotoJornada,
}));
vi.mock("@/lib/storage/comprovantes-surpresa", () => ({
  deletarComprovante: mockDeletarComprovante,
}));
vi.mock("@/lib/storage/posts", () => ({
  deletarImagemPost: mockDeletarImagemPost,
}));
vi.mock("@/lib/storage/planos", () => ({ deletarPlano: mockDeletarPlano }));
import {
  suspenderMembro,
  reativarMembro,
  deletarMembro,
  promoverAParceria,
  revogarParceria,
  promoverAGestora,
  revogarGestora,
} from "./actions";
beforeEach(() => {
  mockRequererAcesso.mockReset();
  mockUpdate.mockReset();
  mockDelete.mockReset();
  mockCount.mockReset();
  mockUpsert.mockReset();
  mockDeleteMany.mockReset();
  mockUpdateManyVinculo.mockReset();
  mockTransaction.mockReset();
  mockRevalidatePath.mockReset();
  mockFindUniquePerfil.mockReset().mockResolvedValue(null);
  mockFindUniquePerfilParceria.mockReset().mockResolvedValue(null);
  mockFindManyFotoEvolucao.mockReset().mockResolvedValue([]);
  mockFindManyJornadaDesafio.mockReset().mockResolvedValue([]);
  mockFindManyParticipacaoSurpresa.mockReset().mockResolvedValue([]);
  mockFindManyPost.mockReset().mockResolvedValue([]);
  mockFindManyPlanoRecebido.mockReset().mockResolvedValue([]);
  mockDeletarFoto.mockReset().mockResolvedValue(undefined);
  mockDeletarFotoPerfil.mockReset().mockResolvedValue(undefined);
  mockDeletarFotoParceria.mockReset().mockResolvedValue(undefined);
  mockDeletarFotoJornada.mockReset().mockResolvedValue(undefined);
  mockDeletarComprovante.mockReset().mockResolvedValue(undefined);
  mockDeletarImagemPost.mockReset().mockResolvedValue(undefined);
  mockDeletarPlano.mockReset().mockResolvedValue(undefined);
  mockRequererAcesso.mockResolvedValue({ user: { id: "patty-1" } });
  mockCount.mockResolvedValue(1);
  mockTransaction.mockImplementation((ops: Promise<unknown>[]) =>
    Promise.all(ops),
  );
});
describe("suspenderMembro", () => {
  it("nega sem acesso", async () => {
    mockRequererAcesso.mockRejectedValue(new Error("Acesso negado"));
    await expect(suspenderMembro("u1")).rejects.toThrow("Acesso negado");
    expect(mockUpdate).not.toHaveBeenCalled();
  });
  it("muda status pra SUSPENSO", async () => {
    mockUpdate.mockResolvedValue({});
    await suspenderMembro("u1");
    expect(mockCount).toHaveBeenCalledWith({
      where: {
        id: { not: "u1" },
        status: "ATIVO",
        papeis: { some: { papel: { in: ["ADMIN", "GESTORA"] } } },
      },
    });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { status: "SUSPENSO" },
    });
  });
  it("bloqueia auto-suspensão, independente de quantos outros ADMIN/GESTORA existam", async () => {
    mockRequererAcesso.mockResolvedValue({ user: { id: "patty-1" } });
    mockCount.mockResolvedValue(5);
    await expect(suspenderMembro("patty-1")).rejects.toThrow(
      "Você não pode suspender a própria conta.",
    );
    expect(mockCount).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
  it("bloqueia se não sobrar nenhuma conta ADMIN/GESTORA ativa depois da ação", async () => {
    mockCount.mockResolvedValue(0);
    await expect(suspenderMembro("u1")).rejects.toThrow(
      "Não é possível suspender: não sobraria nenhuma conta ADMIN ou GESTORA ativa.",
    );
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
describe("reativarMembro", () => {
  it("nega sem acesso", async () => {
    mockRequererAcesso.mockRejectedValue(new Error("Acesso negado"));
    await expect(reativarMembro("u1")).rejects.toThrow("Acesso negado");
    expect(mockUpdate).not.toHaveBeenCalled();
  });
  it("muda status pra ATIVO", async () => {
    mockUpdate.mockResolvedValue({});
    await reativarMembro("u1");
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { status: "ATIVO" },
    });
  });
});
describe("deletarMembro", () => {
  it("nega sem acesso", async () => {
    mockRequererAcesso.mockRejectedValue(new Error("Acesso negado"));
    await expect(deletarMembro("u1")).rejects.toThrow("Acesso negado");
    expect(mockDelete).not.toHaveBeenCalled();
  });
  it("deleta o registro quando não há nenhum arquivo pra excluir", async () => {
    mockDelete.mockResolvedValue({});
    await deletarMembro("u1");
    expect(mockCount).toHaveBeenCalledWith({
      where: {
        id: { not: "u1" },
        status: "ATIVO",
        papeis: { some: { papel: { in: ["ADMIN", "GESTORA"] } } },
      },
    });
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "u1" } });
  });
  it("bloqueia auto-exclusão, independente de quantos outros ADMIN/GESTORA existam", async () => {
    mockRequererAcesso.mockResolvedValue({ user: { id: "patty-1" } });
    mockCount.mockResolvedValue(5);
    await expect(deletarMembro("patty-1")).rejects.toThrow(
      "Você não pode deletar a própria conta.",
    );
    expect(mockCount).not.toHaveBeenCalled();
    expect(mockDelete).not.toHaveBeenCalled();
  });
  it("bloqueia se não sobrar nenhuma conta ADMIN/GESTORA ativa depois da ação", async () => {
    mockCount.mockResolvedValue(0);
    await expect(deletarMembro("u1")).rejects.toThrow(
      "Não é possível deletar: não sobraria nenhuma conta ADMIN ou GESTORA ativa.",
    );
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("purga do R2 a foto de perfil própria e a de parceria, antes de deletar o registro", async () => {
    mockFindUniquePerfil.mockResolvedValue({ fotoChave: "perfis-cliente/u1/foto.webp" });
    mockFindUniquePerfilParceria.mockResolvedValue({
      fotoChave: "perfis-parceria/u1/foto.webp",
    });
    mockDelete.mockResolvedValue({});

    await deletarMembro("u1");

    expect(mockDeletarFotoPerfil).toHaveBeenCalledWith("perfis-cliente/u1/foto.webp");
    expect(mockDeletarFotoParceria).toHaveBeenCalledWith("perfis-parceria/u1/foto.webp");
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "u1" } });
  });

  it("não tenta purgar foto de perfil/parceria quando não existem", async () => {
    mockFindUniquePerfil.mockResolvedValue({ fotoChave: null });
    mockFindUniquePerfilParceria.mockResolvedValue(null);
    mockDelete.mockResolvedValue({});

    await deletarMembro("u1");

    expect(mockDeletarFotoPerfil).not.toHaveBeenCalled();
    expect(mockDeletarFotoParceria).not.toHaveBeenCalled();
  });

  it("purga todas as fotos de evolução do cliente", async () => {
    mockFindManyFotoEvolucao.mockResolvedValue([
      { chave: "fotos-evolucao/u1/a.webp" },
      { chave: "fotos-evolucao/u1/b.webp" },
    ]);
    mockDelete.mockResolvedValue({});

    await deletarMembro("u1");

    expect(mockFindManyFotoEvolucao).toHaveBeenCalledWith({
      where: { clienteId: "u1" },
    });
    expect(mockDeletarFoto).toHaveBeenCalledWith("fotos-evolucao/u1/a.webp");
    expect(mockDeletarFoto).toHaveBeenCalledWith("fotos-evolucao/u1/b.webp");
  });

  it("purga fotos de antes/depois das jornadas de desafio, só as que existem", async () => {
    mockFindManyJornadaDesafio.mockResolvedValue([
      {
        fotoAntesChave: "jornada-desafio/u1/antes.webp",
        fotoDepoisChave: "jornada-desafio/u1/depois.webp",
      },
      { fotoAntesChave: null, fotoDepoisChave: null },
    ]);
    mockDelete.mockResolvedValue({});

    await deletarMembro("u1");

    expect(mockDeletarFotoJornada).toHaveBeenCalledWith("jornada-desafio/u1/antes.webp");
    expect(mockDeletarFotoJornada).toHaveBeenCalledWith("jornada-desafio/u1/depois.webp");
    expect(mockDeletarFotoJornada).toHaveBeenCalledTimes(2);
  });

  it("purga comprovantes de desafio surpresa só quando têm foto", async () => {
    mockFindManyParticipacaoSurpresa.mockResolvedValue([
      { fotoChave: "comprovantes-surpresa/u1/x.webp" },
      { fotoChave: null },
    ]);
    mockDelete.mockResolvedValue({});

    await deletarMembro("u1");

    expect(mockDeletarComprovante).toHaveBeenCalledWith(
      "comprovantes-surpresa/u1/x.webp",
    );
    expect(mockDeletarComprovante).toHaveBeenCalledTimes(1);
  });

  it("purga imagens de post do autor só quando têm imagem", async () => {
    mockFindManyPost.mockResolvedValue([
      { imagemChave: "posts/u1/x.webp" },
      { imagemChave: null },
    ]);
    mockDelete.mockResolvedValue({});

    await deletarMembro("u1");

    expect(mockFindManyPost).toHaveBeenCalledWith({ where: { autorId: "u1" } });
    expect(mockDeletarImagemPost).toHaveBeenCalledWith("posts/u1/x.webp");
    expect(mockDeletarImagemPost).toHaveBeenCalledTimes(1);
  });

  it("purga planos recebidos como cliente e enviados como parceria", async () => {
    mockFindManyPlanoRecebido.mockResolvedValue([
      { arquivoChave: "planos/x/a.pdf" },
      { arquivoChave: "planos/x/b.pdf" },
    ]);
    mockDelete.mockResolvedValue({});

    await deletarMembro("u1");

    expect(mockFindManyPlanoRecebido).toHaveBeenCalledWith({
      where: { OR: [{ clienteId: "u1" }, { parceriaId: "u1" }] },
    });
    expect(mockDeletarPlano).toHaveBeenCalledWith("planos/x/a.pdf");
    expect(mockDeletarPlano).toHaveBeenCalledWith("planos/x/b.pdf");
  });
});
describe("promoverAParceria", () => {
  it("nega sem acesso", async () => {
    mockRequererAcesso.mockRejectedValue(new Error("Acesso negado"));
    await expect(promoverAParceria("u1")).rejects.toThrow("Acesso negado");
    expect(mockUpsert).not.toHaveBeenCalled();
  });
  it("cria o papel PARCERIA via upsert (idempotente se já existir)", async () => {
    mockUpsert.mockResolvedValue({});
    await promoverAParceria("u1");
    expect(mockUpsert).toHaveBeenCalledWith({
      where: { userId_papel: { userId: "u1", papel: "PARCERIA" } },
      create: { userId: "u1", papel: "PARCERIA" },
      update: {},
    });
  });
});
describe("revogarParceria", () => {
  it("nega sem acesso", async () => {
    mockRequererAcesso.mockRejectedValue(new Error("Acesso negado"));
    await expect(revogarParceria("u1")).rejects.toThrow("Acesso negado");
    expect(mockTransaction).not.toHaveBeenCalled();
  });
  it("remove o papel PARCERIA e desativa os vínculos ativos dessa parceria, na mesma transação", async () => {
    mockDeleteMany.mockResolvedValue({ count: 1 });
    mockUpdateManyVinculo.mockResolvedValue({ count: 2 });
    await revogarParceria("u1");
    expect(mockDeleteMany).toHaveBeenCalledWith({
      where: { userId: "u1", papel: "PARCERIA" },
    });
    expect(mockUpdateManyVinculo).toHaveBeenCalledWith({
      where: { parceriaId: "u1", ativo: true },
      data: { ativo: false },
    });
    expect(mockTransaction).toHaveBeenCalledTimes(1);
  });
});
describe("promoverAGestora", () => {
  it("nega sem acesso", async () => {
    mockRequererAcesso.mockRejectedValue(new Error("Acesso negado"));
    await expect(promoverAGestora("u1")).rejects.toThrow("Acesso negado");
    expect(mockUpsert).not.toHaveBeenCalled();
  });
  it("bloqueia se quem chama não for ADMIN", async () => {
    mockRequererAcesso.mockResolvedValue({
      user: { id: "patty-1", papeis: ["GESTORA"] },
    });
    await expect(promoverAGestora("u1")).rejects.toThrow(
      "Só uma conta ADMIN pode gerenciar o papel de Gestora.",
    );
    expect(mockUpsert).not.toHaveBeenCalled();
  });
  it("cria o papel GESTORA via upsert quando quem chama é ADMIN (idempotente se já existir)", async () => {
    mockRequererAcesso.mockResolvedValue({
      user: { id: "patty-1", papeis: ["ADMIN"] },
    });
    mockUpsert.mockResolvedValue({});
    await promoverAGestora("u1");
    expect(mockUpsert).toHaveBeenCalledWith({
      where: { userId_papel: { userId: "u1", papel: "GESTORA" } },
      create: { userId: "u1", papel: "GESTORA" },
      update: {},
    });
  });
});
describe("revogarGestora", () => {
  it("nega sem acesso", async () => {
    mockRequererAcesso.mockRejectedValue(new Error("Acesso negado"));
    await expect(revogarGestora("u1")).rejects.toThrow("Acesso negado");
    expect(mockDeleteMany).not.toHaveBeenCalled();
  });
  it("bloqueia se quem chama não for ADMIN", async () => {
    mockRequererAcesso.mockResolvedValue({
      user: { id: "patty-1", papeis: ["GESTORA"] },
    });
    await expect(revogarGestora("u1")).rejects.toThrow(
      "Só uma conta ADMIN pode gerenciar o papel de Gestora.",
    );
    expect(mockDeleteMany).not.toHaveBeenCalled();
  });
  it("bloqueia se não sobrar nenhuma conta ADMIN/GESTORA ativa depois da ação", async () => {
    mockRequererAcesso.mockResolvedValue({
      user: { id: "patty-1", papeis: ["ADMIN"] },
    });
    mockCount.mockResolvedValue(0);
    await expect(revogarGestora("u1")).rejects.toThrow(
      "Não é possível revogar: não sobraria nenhuma conta ADMIN ou GESTORA ativa.",
    );
    expect(mockDeleteMany).not.toHaveBeenCalled();
  });
  it("remove o papel GESTORA quando quem chama é ADMIN e não causa lockout", async () => {
    mockRequererAcesso.mockResolvedValue({
      user: { id: "patty-1", papeis: ["ADMIN"] },
    });
    mockDeleteMany.mockResolvedValue({ count: 1 });
    await revogarGestora("u1");
    expect(mockDeleteMany).toHaveBeenCalledWith({
      where: { userId: "u1", papel: "GESTORA" },
    });
  });
});
