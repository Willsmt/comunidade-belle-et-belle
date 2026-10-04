import { beforeEach, describe, expect, it, vi } from "vitest";

// Pages do painel checam o acesso elas mesmas: CLIENTE é barrada antes de
// qualquer leitura de dados; GESTORA e ADMIN passam.

const { mockAuth, mockLeitura } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockLeitura: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("next/navigation", () => ({
  redirect: (destino: string) => {
    throw new Error(`NEXT_REDIRECT:${destino}`);
  },
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

// Leituras que as pages consomem: cada chamada registra no mesmo spy
vi.mock("./aprovacoes/queries", () => ({
  listarPendentes: async () => (mockLeitura(), []),
  listarComprovacoesPendentes: async () => (
    mockLeitura(),
    { itens: [], participacoesSurpresa: [] }
  ),
}));
vi.mock("./desafios/queries", () => ({
  listarDesafios: async () => (mockLeitura(), []),
}));
vi.mock("./desafios/emblemas/queries", () => ({
  listarEmblemas: async () => (mockLeitura(), []),
}));
vi.mock("./desafios/[desafioId]/queries", () => ({
  obterDesafioComCategorias: async () => (mockLeitura(), null),
}));
vi.mock("./membros/queries", () => ({
  listarMembros: async () => (mockLeitura(), []),
  contarAdminsGestorasAtivos: async () => (mockLeitura(), 2),
}));
vi.mock("./membros/[membroId]/queries", () => ({
  obterMembro: async () => (mockLeitura(), null),
  obterCicloAtivo: async () => (mockLeitura(), null),
  listarHistoricoCiclos: async () => (mockLeitura(), []),
}));
vi.mock("./pacotes/queries", () => ({
  listarTiposSessao: async () => (mockLeitura(), []),
  listarTiposPacote: async () => (mockLeitura(), []),
}));
vi.mock("./vinculos/queries", () => ({
  listarVinculos: async () => (mockLeitura(), []),
  listarClientesEParcerias: async () => (mockLeitura(), { clientes: [], parcerias: [] }),
}));

import AprovacoesPage from "./aprovacoes/page";
import DesafiosPage from "./desafios/page";
import DesafioDetalhePage from "./desafios/[desafioId]/page";
import EmblemasPage from "./desafios/emblemas/page";
import MembrosPage from "./membros/page";
import MembroPacotePage from "./membros/[membroId]/page";
import PacotesPage from "./pacotes/page";
import VinculosPage from "./vinculos/page";

const PAGES: [string, () => Promise<unknown>, string | null][] = [
  ["aprovacoes", () => AprovacoesPage(), null],
  ["desafios", () => DesafiosPage(), null],
  // sem desafio/membro no mock: passar do gate termina em notFound
  ["desafios/[desafioId]", () => DesafioDetalhePage({ params: Promise.resolve({ desafioId: "d1" }) }), "NEXT_NOT_FOUND"],
  ["desafios/emblemas", () => EmblemasPage(), null],
  ["membros", () => MembrosPage(), null],
  ["membros/[membroId]", () => MembroPacotePage({ params: Promise.resolve({ membroId: "m1" }) }), "NEXT_NOT_FOUND"],
  ["pacotes", () => PacotesPage(), null],
  ["vinculos", () => VinculosPage(), null],
];

const sessao = (papeis: string[], status = "ATIVO") => ({
  user: { id: "u1", status, papeis },
});

describe.each(PAGES)("page /painel/%s", (_rota, renderizar, erroAposGate) => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockLeitura.mockReset();
  });

  it.each([
    ["sem sessão", null],
    ["CLIENTE", sessao(["CLIENTE"])],
    ["PARCERIA", sessao(["PARCERIA"])],
    ["GESTORA SUSPENSA", sessao(["GESTORA"], "SUSPENSO")],
  ])("barra %s antes de ler dados", async (_quem, s) => {
    mockAuth.mockResolvedValue(s);
    await expect(renderizar()).rejects.toThrow("NEXT_REDIRECT:/");
    expect(mockLeitura).not.toHaveBeenCalled();
  });

  it.each(["GESTORA", "ADMIN"])("deixa %s ativa passar", async (papel) => {
    mockAuth.mockResolvedValue(sessao([papel]));
    if (erroAposGate) {
      await expect(renderizar()).rejects.toThrow(erroAposGate);
    } else {
      await expect(renderizar()).resolves.toBeDefined();
    }
    expect(mockLeitura).toHaveBeenCalled();
  });
});
