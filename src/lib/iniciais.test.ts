import { describe, expect, it } from "vitest";
import { obterIniciais } from "./iniciais";

describe("obterIniciais", () => {
  it("retorna a primeira letra do primeiro e do último nome", () => {
    expect(obterIniciais("Maria Silva")).toBe("MS");
    expect(obterIniciais("Maria Eduarda Silva Santos")).toBe("MS");
  });

  it("retorna só a primeira letra quando o nome tem uma única palavra", () => {
    expect(obterIniciais("Maria")).toBe("M");
  });

  it("ignora espaços extras entre as palavras", () => {
    expect(obterIniciais("  Maria   Silva  ")).toBe("MS");
  });

  it("deixa em maiúscula mesmo se o nome vier em minúsculo", () => {
    expect(obterIniciais("maria silva")).toBe("MS");
  });

  it("retorna string vazia para nome nulo, indefinido ou vazio", () => {
    expect(obterIniciais(null)).toBe("");
    expect(obterIniciais(undefined)).toBe("");
    expect(obterIniciais("")).toBe("");
    expect(obterIniciais("   ")).toBe("");
  });
});
