import { describe, expect, it } from "vitest";
import { podeAcessarPainel } from "./pode-acessar-painel";

describe("podeAcessarPainel", () => {
  it("permite GESTORA", () => {
    expect(podeAcessarPainel(["GESTORA"])).toBe(true);
  });

  it("permite ADMIN", () => {
    expect(podeAcessarPainel(["ADMIN"])).toBe(true);
  });

  it("permite quando a pessoa acumula papel de acesso com outro", () => {
    expect(podeAcessarPainel(["CLIENTE", "PARCERIA", "GESTORA"])).toBe(true);
  });

  it("nega CLIENTE isolado", () => {
    expect(podeAcessarPainel(["CLIENTE"])).toBe(false);
  });

  it("nega PARCERIA isolada", () => {
    expect(podeAcessarPainel(["PARCERIA"])).toBe(false);
  });

  it("nega lista vazia de papéis", () => {
    expect(podeAcessarPainel([])).toBe(false);
  });
});
