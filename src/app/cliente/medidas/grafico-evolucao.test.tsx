// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { GraficoEvolucao, LINHAS, OCULTAS_POR_PADRAO, type PontoEvolucao } from "./grafico-evolucao";

// Mock leve do recharts: testamos a lógica de estado/toggle deste componente
// (o que realmente é nosso), não a renderização SVG interna da biblioteca —
// jsdom não implementa layout/medição de texto reais, então asserções sobre
// <path>/<svg> do recharts seriam frágeis e não diriam respeito ao nosso código.
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Legend: ({
    onClick,
  }: {
    onClick: (entry: { dataKey: string }) => void;
  }) => (
    <div>
      {LINHAS.map((linha) => (
        <button key={linha.dataKey} onClick={() => onClick({ dataKey: linha.dataKey })}>
          {linha.name}
        </button>
      ))}
    </div>
  ),
  Line: ({ dataKey, hide }: { dataKey: string; hide: boolean }) => (
    <div data-testid={`line-${dataKey}`} data-hidden={String(hide)} />
  ),
}));

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

describe("GraficoEvolucao", () => {
  it("mostra a mensagem de vazio quando não há pontos", () => {
    render(<GraficoEvolucao pontos={[]} />);
    expect(
      screen.getByText(/sem registros suficientes/i),
    ).toBeInTheDocument();
  });

  it("estado inicial: Peso, Abdômen, Quadril e Coxa visíveis; as outras 9 medidas ocultas", () => {
    render(<GraficoEvolucao pontos={[PONTO]} />);

    for (const linha of LINHAS) {
      const esperaOculta = OCULTAS_POR_PADRAO.has(linha.dataKey);
      expect(screen.getByTestId(`line-${linha.dataKey}`)).toHaveAttribute(
        "data-hidden",
        String(esperaOculta),
      );
    }

    // Confirma explicitamente as 4 visíveis por padrão (o pedido específico).
    for (const dataKey of ["peso", "abdomen", "quadril", "coxa"]) {
      expect(screen.getByTestId(`line-${dataKey}`)).toHaveAttribute(
        "data-hidden",
        "false",
      );
    }
  });

  it("clicar numa legenda de tronco oculta (Ombro) mostra a linha; clicar de novo esconde de novo", () => {
    render(<GraficoEvolucao pontos={[PONTO]} />);

    expect(screen.getByTestId("line-ombro")).toHaveAttribute("data-hidden", "true");

    fireEvent.click(screen.getByText("Ombro (cm)"));
    expect(screen.getByTestId("line-ombro")).toHaveAttribute("data-hidden", "false");

    fireEvent.click(screen.getByText("Ombro (cm)"));
    expect(screen.getByTestId("line-ombro")).toHaveAttribute("data-hidden", "true");
  });

  it("clicar numa legenda de membro oculta (Joelho) mostra a linha; clicar de novo esconde de novo", () => {
    render(<GraficoEvolucao pontos={[PONTO]} />);

    expect(screen.getByTestId("line-joelho")).toHaveAttribute("data-hidden", "true");

    fireEvent.click(screen.getByText("Joelho (cm)"));
    expect(screen.getByTestId("line-joelho")).toHaveAttribute("data-hidden", "false");

    fireEvent.click(screen.getByText("Joelho (cm)"));
    expect(screen.getByTestId("line-joelho")).toHaveAttribute("data-hidden", "true");
  });

  it("clicar numa legenda de membro visível (Coxa) esconde a linha correspondente", () => {
    render(<GraficoEvolucao pontos={[PONTO]} />);

    expect(screen.getByTestId("line-coxa")).toHaveAttribute("data-hidden", "false");

    fireEvent.click(screen.getByText("Coxa (cm)"));
    expect(screen.getByTestId("line-coxa")).toHaveAttribute("data-hidden", "true");
  });

  it("clicar numa legenda visível esconde a linha correspondente", () => {
    render(<GraficoEvolucao pontos={[PONTO]} />);

    expect(screen.getByTestId("line-peso")).toHaveAttribute("data-hidden", "false");

    fireEvent.click(screen.getByText("Peso (kg)"));
    expect(screen.getByTestId("line-peso")).toHaveAttribute("data-hidden", "true");
  });

  it("alternar uma linha não afeta o estado das demais", () => {
    render(<GraficoEvolucao pontos={[PONTO]} />);

    fireEvent.click(screen.getByText("Ombro (cm)"));

    expect(screen.getByTestId("line-ombro")).toHaveAttribute("data-hidden", "false");
    expect(screen.getByTestId("line-peso")).toHaveAttribute("data-hidden", "false");
    expect(screen.getByTestId("line-quadril")).toHaveAttribute("data-hidden", "false");
    expect(screen.getByTestId("line-cintura")).toHaveAttribute("data-hidden", "true");
  });
});
