import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockRedirect } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockRedirect: vi.fn((destino: string) => {
    throw new Error(`NEXT_REDIRECT:${destino}`);
  }),
}));
vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("next/navigation", () => ({ redirect: mockRedirect }));

import {
  requererAcessoPainel,
  requererAcessoPainelOuRedirecionar,
  requererPapel,
  requererSessao,
} from "./requerer-acesso-painel";

const sessao = (status: string, papeis: string[] = ["GESTORA"]) => ({
  user: { id: "u1", status, papeis },
});

describe.each(["PENDENTE", "SUSPENSO"])("conta %s", (status) => {
  beforeEach(() => mockAuth.mockReset());

  it("requererSessao nega", async () => {
    mockAuth.mockResolvedValue(sessao(status));
    await expect(requererSessao()).rejects.toThrow("Acesso negado");
  });

  it("requererPapel nega mesmo com o papel certo", async () => {
    mockAuth.mockResolvedValue(sessao(status, ["CLIENTE"]));
    await expect(requererPapel(["CLIENTE"])).rejects.toThrow("Acesso negado");
  });

  it("requererAcessoPainel nega mesmo com papel de painel", async () => {
    mockAuth.mockResolvedValue(sessao(status, ["ADMIN"]));
    await expect(requererAcessoPainel()).rejects.toThrow("Acesso negado");
  });

  it("requererAcessoPainelOuRedirecionar redireciona mesmo com papel de painel", async () => {
    mockAuth.mockResolvedValue(sessao(status, ["ADMIN"]));
    await expect(requererAcessoPainelOuRedirecionar()).rejects.toThrow("NEXT_REDIRECT:/");
  });
});

describe("requererSessao", () => {
  beforeEach(() => mockAuth.mockReset());

  it("nega sem sessão", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(requererSessao()).rejects.toThrow("Acesso negado");
  });

  it("aceita conta ATIVA", async () => {
    const s = sessao("ATIVO", ["CLIENTE"]);
    mockAuth.mockResolvedValue(s);
    await expect(requererSessao()).resolves.toBe(s);
  });
});

describe("requererPapel", () => {
  beforeEach(() => mockAuth.mockReset());

  it("nega sem sessão", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(requererPapel(["CLIENTE"])).rejects.toThrow("Acesso negado");
  });

  it("nega conta ATIVA sem o papel", async () => {
    mockAuth.mockResolvedValue(sessao("ATIVO", ["PARCERIA"]));
    await expect(requererPapel(["CLIENTE"])).rejects.toThrow("Acesso negado");
  });

  it("aceita conta ATIVA com o papel", async () => {
    const s = sessao("ATIVO", ["CLIENTE"]);
    mockAuth.mockResolvedValue(s);
    await expect(requererPapel(["CLIENTE"])).resolves.toBe(s);
  });

  it("nega sessão sem status (não enriquecida)", async () => {
    mockAuth.mockResolvedValue({ user: { papeis: ["CLIENTE"] } });
    await expect(requererPapel(["CLIENTE"])).rejects.toThrow("Acesso negado");
  });
});

describe("requererAcessoPainel", () => {
  beforeEach(() => mockAuth.mockReset());

  it("nega sem sessão", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(requererAcessoPainel()).rejects.toThrow("Acesso negado");
  });

  it("nega CLIENTE ativa", async () => {
    mockAuth.mockResolvedValue(sessao("ATIVO", ["CLIENTE"]));
    await expect(requererAcessoPainel()).rejects.toThrow("Acesso negado");
  });

  it.each(["GESTORA", "ADMIN"])("aceita %s ativa", async (papel) => {
    const s = sessao("ATIVO", [papel]);
    mockAuth.mockResolvedValue(s);
    await expect(requererAcessoPainel()).resolves.toBe(s);
  });
});

describe("requererAcessoPainelOuRedirecionar", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockRedirect.mockClear();
  });

  it("redireciona para / sem sessão", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(requererAcessoPainelOuRedirecionar()).rejects.toThrow("NEXT_REDIRECT:/");
  });

  it("redireciona CLIENTE ativa", async () => {
    mockAuth.mockResolvedValue(sessao("ATIVO", ["CLIENTE"]));
    await expect(requererAcessoPainelOuRedirecionar()).rejects.toThrow("NEXT_REDIRECT:/");
  });

  it.each(["GESTORA", "ADMIN"])("deixa %s ativa passar e devolve a sessão", async (papel) => {
    const s = sessao("ATIVO", [papel]);
    mockAuth.mockResolvedValue(s);
    await expect(requererAcessoPainelOuRedirecionar()).resolves.toBe(s);
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});

// Fluxos de conta não ATIVA não passam por estes gates: /bem-vinda
// (aceitarTermo), /aguardando-aprovacao (polling via useSession) e
// /conta-suspensa (sair) usam auth()/signOut diretamente.
