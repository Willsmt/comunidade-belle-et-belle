// @vitest-environment jsdom
//
// Suite separada, SEM mock do recharts — a suite principal
// (grafico-evolucao.test.tsx) mocka o recharts pra testar nossa lógica de
// estado/toggle isolada da renderização da lib. Aqui testamos exatamente o
// oposto: a cor real que o Recharts aplica no texto da legenda, que é onde
// o bug de "sempre cinza, ativo ou não" apareceu (entry.color = stroke da
// própria linha, nunca ligado a ativo/inativo, pra linhas que usam os tons
// mais claros da paleta — Peso, Cintura, Joelho).
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { GraficoEvolucao, LINHAS, OCULTAS_POR_PADRAO, type PontoEvolucao } from "./grafico-evolucao";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    width: 500,
    height: 320,
    top: 0,
    left: 0,
    bottom: 320,
    right: 500,
    x: 0,
    y: 0,
    toJSON: () => {},
  } as DOMRect);
});

const PONTO: PontoEvolucao = {
  data: "2026-01-01",
  peso: 60,
  ombro: 40,
  peitoBusto: 90,
  cintura: 70,
  abdomen: 75,
  quadril: 95,
  braco: 29,
  antebraco: 25,
  punho: 15,
  coxa: 55,
  joelho: 38,
  panturrilha: 33,
  tornozelo: 22,
};

function corDoTexto(nomeLegenda: string): string {
  const span = screen
    .getByText(nomeLegenda)
    .closest("li")
    ?.querySelector(".recharts-legend-item-text");
  return (span as HTMLElement).style.color;
}

describe("cor da legenda reflete ativo/inativo de verdade (não a cor própria da linha)", () => {
  it("todas as 13 linhas mudam de cor ao alternar — inclusive as que usam tons claros da paleta (Peso, Ombro, Joelho: --chart-1)", () => {
    render(<GraficoEvolucao pontos={[PONTO]} />);

    for (const linha of LINHAS) {
      const corInicial = corDoTexto(linha.name);
      const corEsperadaInicial = OCULTAS_POR_PADRAO.has(linha.dataKey)
        ? "var(--muted-foreground)"
        : "var(--foreground)";
      expect(corInicial).toBe(corEsperadaInicial);

      fireEvent.click(screen.getByText(linha.name));

      const corDepois = corDoTexto(linha.name);
      expect(corDepois).not.toBe(corInicial);
      expect(corDepois).toBe(
        corEsperadaInicial === "var(--foreground)"
          ? "var(--muted-foreground)"
          : "var(--foreground)",
      );
    }
  });
});
