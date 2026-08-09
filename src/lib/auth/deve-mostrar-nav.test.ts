import { describe, expect, it } from "vitest";
import { deveMostrarNavegacaoPrincipal } from "./deve-mostrar-nav";

describe("deveMostrarNavegacaoPrincipal", () => {
  it("mostra quando ATIVO e com consentimento", () => {
    expect(
      deveMostrarNavegacaoPrincipal({ status: "ATIVO", temConsentimento: true }),
    ).toBe(true);
  });

  it("esconde quando ATIVO mas sem consentimento ainda", () => {
    expect(
      deveMostrarNavegacaoPrincipal({ status: "ATIVO", temConsentimento: false }),
    ).toBe(false);
  });

  it("esconde quando PENDENTE", () => {
    expect(
      deveMostrarNavegacaoPrincipal({ status: "PENDENTE", temConsentimento: false }),
    ).toBe(false);
  });

  it("esconde quando SUSPENSO", () => {
    expect(
      deveMostrarNavegacaoPrincipal({ status: "SUSPENSO", temConsentimento: true }),
    ).toBe(false);
  });

  it("esconde quando não há sessão", () => {
    expect(deveMostrarNavegacaoPrincipal(null)).toBe(false);
  });
});
