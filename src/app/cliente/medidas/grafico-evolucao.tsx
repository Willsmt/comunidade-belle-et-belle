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

const LINHAS: Array<{
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
          {LINHAS.map((linha) => (
            <Line
              key={linha.dataKey}
              type="monotone"
              dataKey={linha.dataKey}
              name={linha.name}
              stroke={linha.stroke}
              strokeDasharray={linha.strokeDasharray}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
