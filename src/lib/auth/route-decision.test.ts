import { describe, expect, it } from "vitest";
import { decideRoute } from "./route-decision";

describe("decideRoute", () => {
  it("sem sessão vai pro login", () => {
    expect(decideRoute(null, "/")).toEqual({ action: "redirect", to: "/login" });
  });

  it("sem sessão já no login não redireciona", () => {
    expect(decideRoute(null, "/login")).toEqual({ action: "next" });
  });

  it("PENDENTE vai pra tela de espera", () => {
    const usuario = { status: "PENDENTE" as const, temConsentimento: false };
    expect(decideRoute(usuario, "/")).toEqual({ action: "redirect", to: "/aguardando-aprovacao" });
  });

  it("PENDENTE já na tela de espera não redireciona", () => {
    const usuario = { status: "PENDENTE" as const, temConsentimento: false };
    expect(decideRoute(usuario, "/aguardando-aprovacao")).toEqual({ action: "next" });
  });

  it("SUSPENSO vai pra tela de conta suspensa", () => {
    const usuario = { status: "SUSPENSO" as const, temConsentimento: true };
    expect(decideRoute(usuario, "/")).toEqual({ action: "redirect", to: "/conta-suspensa" });
  });

  it("SUSPENSO já na tela de suspensa não redireciona", () => {
    const usuario = { status: "SUSPENSO" as const, temConsentimento: true };
    expect(decideRoute(usuario, "/conta-suspensa")).toEqual({ action: "next" });
  });

  it("ATIVO sem consentimento vai pra boas-vindas", () => {
    const usuario = { status: "ATIVO" as const, temConsentimento: false };
    expect(decideRoute(usuario, "/")).toEqual({ action: "redirect", to: "/bem-vinda" });
  });

  it("ATIVO sem consentimento já em boas-vindas não redireciona", () => {
    const usuario = { status: "ATIVO" as const, temConsentimento: false };
    expect(decideRoute(usuario, "/bem-vinda")).toEqual({ action: "next" });
  });

  it("ATIVO com consentimento libera o app", () => {
    const usuario = { status: "ATIVO" as const, temConsentimento: true };
    expect(decideRoute(usuario, "/")).toEqual({ action: "next" });
    expect(decideRoute(usuario, "/desafios")).toEqual({ action: "next" });
  });

  it("ATIVO com consentimento é tirado das telas de gate se tentar voltar nelas", () => {
    const usuario = { status: "ATIVO" as const, temConsentimento: true };
    expect(decideRoute(usuario, "/login")).toEqual({ action: "redirect", to: "/" });
    expect(decideRoute(usuario, "/aguardando-aprovacao")).toEqual({ action: "redirect", to: "/" });
    expect(decideRoute(usuario, "/bem-vinda")).toEqual({ action: "redirect", to: "/" });
    expect(decideRoute(usuario, "/conta-suspensa")).toEqual({ action: "redirect", to: "/" });
  });
});
