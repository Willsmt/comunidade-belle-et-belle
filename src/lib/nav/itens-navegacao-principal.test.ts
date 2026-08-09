import { describe, expect, it } from "vitest";
import { itensNavegacaoPrincipal } from "./itens-navegacao-principal";

describe("itensNavegacaoPrincipal", () => {
  it("mostra só o Feed quando a pessoa não acumula nenhum papel de área", () => {
    const itens = itensNavegacaoPrincipal([]);

    expect(itens.map((item) => item.label)).toEqual(["Feed"]);
  });

  it("inclui Área da cliente pro papel CLIENTE", () => {
    const itens = itensNavegacaoPrincipal(["CLIENTE"]);

    expect(itens.map((item) => item.label)).toEqual(["Feed", "Área da cliente"]);
  });

  it("inclui Área da parceria pro papel PARCERIA", () => {
    const itens = itensNavegacaoPrincipal(["PARCERIA"]);

    expect(itens.map((item) => item.label)).toEqual(["Feed", "Área da parceria"]);
  });

  it("inclui Painel pros papéis GESTORA/ADMIN", () => {
    expect(itensNavegacaoPrincipal(["GESTORA"]).map((item) => item.label)).toEqual([
      "Feed",
      "Painel",
    ]);
    expect(itensNavegacaoPrincipal(["ADMIN"]).map((item) => item.label)).toEqual([
      "Feed",
      "Painel",
    ]);
  });

  it("acumula vários itens quando a pessoa tem vários papéis (ex: Patty GESTORA + PARCERIA)", () => {
    const itens = itensNavegacaoPrincipal(["GESTORA", "PARCERIA"]);

    expect(itens.map((item) => item.label)).toEqual([
      "Feed",
      "Área da parceria",
      "Painel",
    ]);
  });
});
