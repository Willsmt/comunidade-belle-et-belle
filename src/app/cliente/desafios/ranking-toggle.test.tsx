// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RankingToggle } from "./ranking-toggle";

const rankingSemanal = [
  { clienteId: "c1", nome: "Você", pontos: 8, fotoUrl: null },
  { clienteId: "c2", nome: "Marina", pontos: 10, fotoUrl: "https://exemplo/marina.jpg" },
];
const rankingGeral = [
  { clienteId: "c2", nome: "Marina", pontos: 100, fotoUrl: null },
  { clienteId: "c1", nome: "Você", pontos: 90, fotoUrl: null },
];

describe("RankingToggle", () => {
  it("mostra o ranking semanal por padrão, com 'Você' na linha do cliente logado", () => {
    render(
      <RankingToggle rankingSemanal={rankingSemanal} rankingGeral={rankingGeral} clienteId="c1" />,
    );

    expect(screen.getByText("Você")).toBeInTheDocument();
    expect(screen.getByText("8 pts")).toBeInTheDocument();
    expect(screen.queryByText("100 pts")).not.toBeInTheDocument();
  });

  it("troca pro ranking geral ao clicar no botão", () => {
    render(
      <RankingToggle rankingSemanal={rankingSemanal} rankingGeral={rankingGeral} clienteId="c1" />,
    );

    fireEvent.click(screen.getByRole("button", { name: /ranking geral/i }));

    expect(screen.getByText("100 pts")).toBeInTheDocument();
    expect(screen.queryByText("8 pts")).not.toBeInTheDocument();
  });

  it("mostra mensagem quando o ranking está vazio", () => {
    render(<RankingToggle rankingSemanal={[]} rankingGeral={[]} clienteId="c1" />);

    expect(screen.getByText(/ninguém pontuou ainda/i)).toBeInTheDocument();
  });

  it("mostra a foto de quem tem fotoUrl e as iniciais de quem não tem", () => {
    render(
      <RankingToggle rankingSemanal={rankingSemanal} rankingGeral={rankingGeral} clienteId="c1" />,
    );

    expect(screen.getByAltText("Foto de perfil de Marina")).toHaveAttribute(
      "src",
      "https://exemplo/marina.jpg",
    );
    expect(screen.getByText("V")).toBeInTheDocument();
  });
});
