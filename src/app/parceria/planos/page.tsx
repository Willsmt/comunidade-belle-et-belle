import { listarClientesVinculadas, listarPlanosEnviados } from "./queries";
import { FormularioEnvio } from "./formulario-envio";

export default async function PlanosPage() {
  const [clientes, planos] = await Promise.all([
    listarClientesVinculadas(),
    listarPlanosEnviados(),
  ]);

  return (
    <section>
      <h1>Meus planos</h1>

      <h2>Enviar novo plano</h2>
      {clientes.length === 0 ? (
        <p>Nenhuma cliente vinculada a você ainda.</p>
      ) : (
        <FormularioEnvio clientes={clientes} />
      )}

      <h2>Histórico de envios</h2>
      {planos.length === 0 ? (
        <p>Nenhum plano enviado ainda.</p>
      ) : (
        <ul>
          {planos.map((plano) => (
            <li key={plano.id}>
              <span>{plano.cliente.name ?? plano.cliente.email}</span>
              <span>{plano.tipo === "TREINO" ? "Treino" : "Dieta"}</span>
              {plano.titulo && <span>{plano.titulo}</span>}
              <span>{plano.enviadoEm.toLocaleDateString("pt-BR")}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
