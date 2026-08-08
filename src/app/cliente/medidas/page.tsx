import { listarMedidas } from "./queries";
import { FormularioRegistro } from "./formulario-registro";
import { GraficoEvolucao, type PontoEvolucao } from "./grafico-evolucao";

export default async function MedidasPage() {
  const medidas = await listarMedidas();

  const pontosGrafico: PontoEvolucao[] = medidas
    .map((medida) => ({
      data: medida.data.toISOString().slice(0, 10),
      peso: medida.peso?.toNumber() ?? null,
      cintura: medida.cintura?.toNumber() ?? null,
      quadril: medida.quadril?.toNumber() ?? null,
      braco: medida.braco?.toNumber() ?? null,
      coxa: medida.coxa?.toNumber() ?? null,
    }))
    .reverse();

  return (
    <section>
      <h1>Minhas medidas</h1>

      <h2>Novo registro</h2>
      <FormularioRegistro />

      <h2>Evolução</h2>
      <GraficoEvolucao pontos={pontosGrafico} />

      <h2>Histórico</h2>
      {medidas.length === 0 ? (
        <p>Nenhum registro ainda.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Peso (kg)</th>
              <th>Cintura (cm)</th>
              <th>Quadril (cm)</th>
              <th>Braço (cm)</th>
              <th>Coxa (cm)</th>
            </tr>
          </thead>
          <tbody>
            {medidas.map((medida) => (
              <tr key={medida.id}>
                <td>{medida.data.toLocaleDateString("pt-BR")}</td>
                <td>{medida.peso?.toString() ?? "—"}</td>
                <td>{medida.cintura?.toString() ?? "—"}</td>
                <td>{medida.quadril?.toString() ?? "—"}</td>
                <td>{medida.braco?.toString() ?? "—"}</td>
                <td>{medida.coxa?.toString() ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
