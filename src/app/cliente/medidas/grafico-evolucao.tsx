"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type PontoEvolucao = {
  data: string;
  peso: number | null;
  ombro: number | null;
  peitoBusto: number | null;
  cintura: number | null;
  abdomen: number | null;
  quadril: number | null;
  braco: number | null;
  antebraco: number | null;
  punho: number | null;
  coxa: number | null;
  joelho: number | null;
  panturrilha: number | null;
  tornozelo: number | null;
};

export const LINHAS: Array<{
  dataKey: keyof Omit<PontoEvolucao, "data">;
  name: string;
  stroke: string;
  strokeDasharray?: string;
}> = [
  { dataKey: "peso", name: "Peso (kg)", stroke: "var(--chart-1)" },
  { dataKey: "cintura", name: "Cintura (cm)", stroke: "var(--chart-2)" },
  { dataKey: "quadril", name: "Quadril (cm)", stroke: "var(--chart-3)" },
  { dataKey: "braco", name: "Braço (cm)", stroke: "var(--chart-4)" },
  { dataKey: "coxa", name: "Coxa (cm)", stroke: "var(--chart-5)" },
  { dataKey: "ombro", name: "Ombro (cm)", stroke: "var(--chart-1)", strokeDasharray: "6 3" },
  { dataKey: "peitoBusto", name: "Peito/busto (cm)", stroke: "var(--chart-2)", strokeDasharray: "6 3" },
  { dataKey: "abdomen", name: "Abdômen (cm)", stroke: "var(--chart-3)", strokeDasharray: "6 3" },
  { dataKey: "antebraco", name: "Antebraço (cm)", stroke: "var(--chart-4)", strokeDasharray: "6 3" },
  { dataKey: "punho", name: "Punho (cm)", stroke: "var(--chart-5)", strokeDasharray: "6 3" },
  { dataKey: "joelho", name: "Joelho (cm)", stroke: "var(--chart-1)", strokeDasharray: "2 2" },
  { dataKey: "panturrilha", name: "Panturrilha (cm)", stroke: "var(--chart-2)", strokeDasharray: "2 2" },
  { dataKey: "tornozelo", name: "Tornozelo (cm)", stroke: "var(--chart-3)", strokeDasharray: "2 2" },
];

export const OCULTAS_POR_PADRAO = new Set<string>([
  "ombro",
  "peitoBusto",
  "cintura",
  "braco",
  "antebraco",
  "punho",
  "joelho",
  "panturrilha",
  "tornozelo",
]);

export function GraficoEvolucao({ pontos }: { pontos: PontoEvolucao[] }) {
  const [ocultas, setOcultas] = useState<Set<string>>(
    () => new Set(OCULTAS_POR_PADRAO),
  );

  if (pontos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Sem registros suficientes para exibir o gráfico ainda.
      </p>
    );
  }

  function alternarLinha(dataKey: string) {
    setOcultas((atual) => {
      const proxima = new Set(atual);
      if (proxima.has(dataKey)) {
        proxima.delete(dataKey);
      } else {
        proxima.add(dataKey);
      }
      return proxima;
    });
  }

  return (
    <div
      style={{ width: "100%", height: 320 }}
      className="[&_.recharts-legend-item]:cursor-pointer [&_.recharts-legend-item.inactive_.recharts-legend-item-text]:line-through [&_.recharts-legend-item.inactive_.recharts-legend-item-text]:opacity-60"
    >
      <ResponsiveContainer>
        <LineChart data={pontos}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="data"
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            stroke="var(--border)"
          />
          <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} stroke="var(--border)" />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--popover)",
              borderColor: "var(--border)",
              borderRadius: "0.5rem",
              color: "var(--popover-foreground)",
              fontSize: 12,
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            labelStyle={{ color: "var(--foreground)" }}
            inactiveColor="var(--muted-foreground)"
            onClick={(entry) => {
              if (typeof entry.dataKey === "string") {
                alternarLinha(entry.dataKey);
              }
            }}
          />
          {LINHAS.map((linha) => (
            <Line
              key={linha.dataKey}
              type="monotone"
              dataKey={linha.dataKey}
              name={linha.name}
              stroke={linha.stroke}
              strokeDasharray={linha.strokeDasharray}
              hide={ocultas.has(linha.dataKey)}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
