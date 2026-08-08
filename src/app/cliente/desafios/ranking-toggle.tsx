"use client";

import { useState } from "react";

type LinhaRanking = { clienteId: string; nome: string; pontos: number };

export function RankingToggle({
  rankingSemanal,
  rankingGeral,
  clienteId,
}: {
  rankingSemanal: LinhaRanking[];
  rankingGeral: LinhaRanking[];
  clienteId: string;
}) {
  const [aba, setAba] = useState<"semana" | "geral">("semana");
  const ranking = aba === "semana" ? rankingSemanal : rankingGeral;

  return (
    <div>
      <div role="tablist" aria-label="Ranking">
        <button type="button" aria-pressed={aba === "semana"} onClick={() => setAba("semana")}>
          Ranking da semana
        </button>
        <button type="button" aria-pressed={aba === "geral"} onClick={() => setAba("geral")}>
          Ranking geral
        </button>
      </div>

      {ranking.length === 0 ? (
        <p>Ninguém pontuou ainda.</p>
      ) : (
        <ol>
          {ranking.map((linha, indice) => (
            <li
              key={linha.clienteId}
              aria-current={linha.clienteId === clienteId ? "true" : undefined}
            >
              <span>{indice + 1}º</span>
              <span>{linha.clienteId === clienteId ? "Você" : linha.nome}</span>
              <span>{linha.pontos} pts</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
