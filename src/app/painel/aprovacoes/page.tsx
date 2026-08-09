import { listarPendentes } from "./queries";
import { rejeitarConta } from "./actions";
import { BotaoComConfirmacao } from "@/components/botao-com-confirmacao";
import { BotaoAprovarConta } from "./botao-aprovar-conta";

export default async function AprovacoesPage() {
  const pendentes = await listarPendentes();

  if (pendentes.length === 0) {
    return (
      <section>
        <h1>Aprovações pendentes</h1>
        <p>Nenhum pedido pendente no momento.</p>
      </section>
    );
  }

  return (
    <section>
      <h1>Aprovações pendentes</h1>
      <ul>
        {pendentes.map((usuario) => (
          <li key={usuario.id}>
            <span>{usuario.name ?? usuario.email}</span>
            <BotaoAprovarConta userId={usuario.id} />
            <BotaoComConfirmacao
              label="Rejeitar"
              mensagemConfirmacao={`Rejeitar o pedido de ${usuario.name ?? usuario.email}? Essa ação não pode ser desfeita.`}
              action={rejeitarConta.bind(null, usuario.id)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
