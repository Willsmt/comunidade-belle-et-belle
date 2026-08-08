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
    return <p>Sem registros suficientes para exibir o gráfico ainda.</p>;
  }

  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <LineChart data={pontos}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="data" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="peso" name="Peso (kg)" stroke="#8884d8" connectNulls />
          <Line type="monotone" dataKey="cintura" name="Cintura (cm)" stroke="#82ca9d" connectNulls />
          <Line type="monotone" dataKey="quadril" name="Quadril (cm)" stroke="#ffc658" connectNulls />
          <Line type="monotone" dataKey="braco" name="Braço (cm)" stroke="#ff7300" connectNulls />
          <Line type="monotone" dataKey="coxa" name="Coxa (cm)" stroke="#00c49f" connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
