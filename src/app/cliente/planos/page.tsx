import Link from "next/link";
import { listarPlanosRecebidos } from "./queries";

export default async function PlanosRecebidosPage() {
  const planos = await listarPlanosRecebidos();

  return (
    <section>
      <h1>Meus planos</h1>
      <Link href="/cliente/parcerias">Ver minhas parcerias</Link>

      {planos.length === 0 ? (
        <p>Nenhum plano recebido ainda.</p>
      ) : (
        <ul>
          {planos.map((plano) => (
            <li key={plano.id}>
              <span>{plano.tipo === "TREINO" ? "Treino" : "Dieta"}</span>
              {plano.titulo && <span>{plano.titulo}</span>}
              <span>{plano.parceria.name ?? plano.parceria.email}</span>
              <span>{plano.enviadoEm.toLocaleDateString("pt-BR")}</span>
              <a href={plano.urlAssinada} target="_blank" rel="noreferrer">
                Ver PDF
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
