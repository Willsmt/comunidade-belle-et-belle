import { listarVinculos, listarClientesEParcerias } from "./queries";
import { criarVinculo, desativarVinculo, reativarVinculo } from "./actions";
import { BotaoComConfirmacao } from "@/components/painel/botao-com-confirmacao";

export default async function VinculosPage() {
  const [vinculos, { clientes, parcerias }] = await Promise.all([
    listarVinculos(),
    listarClientesEParcerias(),
  ]);

  return (
    <section>
      <h1>Vínculos cliente-parceria</h1>

      <h2>Novo vínculo</h2>
      <form action={criarVinculo} aria-label="Criar vínculo">
        <label htmlFor="clienteId">
          Cliente
          <select id="clienteId" name="clienteId" defaultValue="">
            <option value="">Selecione</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.name ?? cliente.email}
              </option>
            ))}
          </select>
        </label>

        <label htmlFor="parceriaId">
          Parceria
          <select id="parceriaId" name="parceriaId" defaultValue="">
            <option value="">Selecione</option>
            {parcerias.map((parceria) => (
              <option key={parceria.id} value={parceria.id}>
                {parceria.name ?? parceria.email}
              </option>
            ))}
          </select>
        </label>

        <button type="submit">Vincular</button>
      </form>

      <h2>Vínculos existentes</h2>
      {vinculos.length === 0 ? (
        <p>Nenhum vínculo ainda.</p>
      ) : (
        <ul>
          {vinculos.map((vinculo) => (
            <li key={vinculo.id}>
              <span>{vinculo.cliente.name ?? vinculo.cliente.email}</span>
              {" ↔ "}
              <span>{vinculo.parceria.name ?? vinculo.parceria.email}</span>
              <span>{vinculo.ativo ? "Ativo" : "Inativo"}</span>

              {vinculo.ativo ? (
                <BotaoComConfirmacao
                  label="Desativar"
                  mensagemConfirmacao={`Desativar o vínculo entre ${
                    vinculo.cliente.name ?? vinculo.cliente.email
                  } e ${
                    vinculo.parceria.name ?? vinculo.parceria.email
                  }? A parceria deixa de ver essa cliente.`}
                  action={desativarVinculo.bind(null, vinculo.id)}
                />
              ) : (
                <form action={reativarVinculo.bind(null, vinculo.id)}>
                  <button type="submit">Reativar</button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
