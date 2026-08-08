import { describe, expect, it } from "vitest";
import { enrichSession } from "./enrich-session";
import type { Session } from "next-auth";

function baseSession(): Session {
  return {
    user: { name: "Teste", email: "teste@example.com" },
    expires: new Date().toISOString(),
  } as Session;
}

describe("enrichSession", () => {
  it("preenche status, papeis e temConsentimento quando o usuário existe", () => {
    const session = enrichSession(baseSession(), "user-1", {
      status: "ATIVO",
      papeis: [{ papel: "CLIENTE" }, { papel: "PARCERIA" }],
      consentimento: { id: "cons-1" },
    });

    expect(session.user.id).toBe("user-1");
    expect(session.user.status).toBe("ATIVO");
    expect(session.user.papeis).toEqual(["CLIENTE", "PARCERIA"]);
    expect(session.user.temConsentimento).toBe(true);
  });

  it("marca temConsentimento como false quando não há consentimento registrado", () => {
    const session = enrichSession(baseSession(), "user-2", {
      status: "PENDENTE",
      papeis: [],
      consentimento: null,
    });

    expect(session.user.temConsentimento).toBe(false);
    expect(session.user.papeis).toEqual([]);
  });

  it("retorna a sessão original sem alterar quando o usuário não é encontrado no banco", () => {
    const session = baseSession();
    const result = enrichSession(session, "user-3", null);

    expect(result).toBe(session);
    expect(result.user.status).toBeUndefined();
  });
});
