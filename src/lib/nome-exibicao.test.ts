import { describe, expect, it } from "vitest";
import { nomeParaExibicao, NOME_FALLBACK_MEMBRA } from "./nome-exibicao";

describe("nomeParaExibicao", () => {
  it("devolve o nome quando existe", () => {
    expect(nomeParaExibicao("Marina")).toBe("Marina");
  });

  it.each([null, undefined, "", "   "])("cai para o fallback com %j", (nome) => {
    expect(nomeParaExibicao(nome)).toBe(NOME_FALLBACK_MEMBRA);
    expect(NOME_FALLBACK_MEMBRA).toBe("Membra da comunidade");
  });
});
