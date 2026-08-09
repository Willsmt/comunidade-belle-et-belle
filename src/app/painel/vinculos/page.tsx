import { listarVinculos, listarClientesEParcerias } from "./queries";
import { desativarVinculo } from "./actions";
import { BotaoComConfirmacao } from "@/components/botao-com-confirmacao";
import { FormularioCriarVinculo } from "./formulario-criar-vinculo";
import { BotaoReativarVinculo } from "./botao-reativar-vinculo";

export default async function VinculosPage() {
  const [vinculos, { clientes, parcerias }] = await Promise.all([
    listarVinculos(),
    listarClientesEParcerias(),
  ]);

  return (
    <section>
      <h1>Vínculos cliente-parceria</h1>

      <h2>Novo vínculo</h2>
      <FormularioCriarVinculo clientes={clientes} parcerias={parcerias} />

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
                <BotaoReativarVinculo vinculoId={vinculo.id} />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
