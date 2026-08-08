import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
vi.mock("@/auth", () => ({ auth: mockAuth }));

import { requererAcessoPainel } from "./requerer-acesso-painel";

describe("requererAcessoPainel", () => {
  beforeEach(() => {
    mockAuth.mockReset();
  });

  it("lança erro sem sessão", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(requererAcessoPainel()).rejects.toThrow("Acesso negado");
  });

  it("lança erro se o papel não tem acesso ao painel", async () => {
    mockAuth.mockResolvedValue({ user: { papeis: ["CLIENTE"] } });
    await expect(requererAcessoPainel()).rejects.toThrow("Acesso negado");
  });

  it("retorna a sessão se o papel tem acesso", async () => {
    const sessao = { user: { papeis: ["GESTORA"] } };
    mockAuth.mockResolvedValue(sessao);
    await expect(requererAcessoPainel()).resolves.toBe(sessao);
  });
});
