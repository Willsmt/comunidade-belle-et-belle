"use client";

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
  cintura: number | null;
  quadril: number | null;
  braco: number | null;
  coxa: number | null;
};

export function GraficoEvolucao({ pontos }: { pontos: PontoEvolucao[] }) {
  if (pontos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Sem registros suficientes para exibir o gráfico ainda.
      </p>
    );
  }

  return (
    <div style={{ width: "100%", height: 320 }}>
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
          <Legend wrapperStyle={{ color: "var(--muted-foreground)", fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="peso"
            name="Peso (kg)"
            stroke="var(--chart-1)"
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="cintura"
            name="Cintura (cm)"
            stroke="var(--chart-2)"
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="quadril"
            name="Quadril (cm)"
            stroke="var(--chart-3)"
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="braco"
            name="Braço (cm)"
            stroke="var(--chart-4)"
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="coxa"
            name="Coxa (cm)"
            stroke="var(--chart-5)"
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
