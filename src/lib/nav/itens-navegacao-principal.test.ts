import { describe, expect, it } from "vitest";
import { itensNavegacaoPrincipal, obterPrefixoAtivo } from "./itens-navegacao-principal";

describe("itensNavegacaoPrincipal", () => {
  it("mostra só o Feed quando a pessoa não acumula nenhum papel de área", () => {
    const itens = itensNavegacaoPrincipal([]);

    expect(itens.map((item) => item.label)).toEqual(["Feed"]);
  });

  it("inclui Área da cliente e Desafios pro papel CLIENTE", () => {
    const itens = itensNavegacaoPrincipal(["CLIENTE"]);

    expect(itens.map((item) => item.label)).toEqual([
      "Feed",
      "Área da cliente",
      "Desafios",
    ]);
  });

  it("inclui Área da parceria pro papel PARCERIA", () => {
    const itens = itensNavegacaoPrincipal(["PARCERIA"]);

    expect(itens.map((item) => item.label)).toEqual(["Feed", "Área da parceria"]);
  });

  it("inclui Desafios e Painel pros papéis GESTORA/ADMIN", () => {
    expect(itensNavegacaoPrincipal(["GESTORA"]).map((item) => item.label)).toEqual([
      "Feed",
      "Desafios",
      "Painel",
    ]);
    expect(itensNavegacaoPrincipal(["ADMIN"]).map((item) => item.label)).toEqual([
      "Feed",
      "Desafios",
      "Painel",
    ]);
  });

  it("mostra Desafios pra quem tem CLIENTE e também GESTORA/ADMIN", () => {
    const itens = itensNavegacaoPrincipal(["CLIENTE", "GESTORA"]);

    expect(itens.map((item) => item.label)).toEqual([
      "Feed",
      "Área da cliente",
      "Desafios",
      "Painel",
    ]);
  });

  it("não mostra Desafios pra PARCERIA sem CLIENTE nem GESTORA/ADMIN", () => {
    const itens = itensNavegacaoPrincipal(["PARCERIA"]);

    expect(itens.map((item) => item.label)).not.toContain("Desafios");
  });

  it("acumula vários itens quando a pessoa tem vários papéis (ex: Patty GESTORA + PARCERIA)", () => {
    const itens = itensNavegacaoPrincipal(["GESTORA", "PARCERIA"]);

    expect(itens.map((item) => item.label)).toEqual([
      "Feed",
      "Área da parceria",
      "Desafios",
      "Painel",
    ]);
  });
});

describe("obterPrefixoAtivo", () => {
  it("escolhe o prefixo mais específico quando mais de um bate (ex: /cliente e /cliente/desafios)", () => {
    const itens = itensNavegacaoPrincipal(["CLIENTE"]);

    expect(obterPrefixoAtivo(itens, "/cliente/desafios")).toBe("/cliente/desafios");
  });

  it("mantém Área da cliente ativa em outras sub-rotas de /cliente", () => {
    const itens = itensNavegacaoPrincipal(["CLIENTE"]);

    expect(obterPrefixoAtivo(itens, "/cliente/medidas")).toBe("/cliente");
  });

  it("retorna null quando nenhum prefixo bate", () => {
    const itens = itensNavegacaoPrincipal(["CLIENTE"]);

    expect(obterPrefixoAtivo(itens, "/bem-vinda")).toBeNull();
  });
});
