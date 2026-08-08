import { listarMembros } from "./queries";
import { suspenderMembro, reativarMembro, deletarMembro } from "./actions";
import { BotaoComConfirmacao } from "@/components/painel/botao-com-confirmacao";

export default async function MembrosPage() {
  const membros = await listarMembros();

  if (membros.length === 0) {
    return (
      <section>
        <h1>Membros</h1>
        <p>Nenhum membro ainda.</p>
      </section>
    );
  }

  return (
    <section>
      <h1>Membros</h1>
      <ul>
        {membros.map((membro) => (
          <li key={membro.id}>
            <span>{membro.name ?? membro.email}</span>
            <span>{membro.status}</span>
            {membro.status === "ATIVO" ? (
              <BotaoComConfirmacao
                label="Suspender"
                mensagemConfirmacao={`Suspender ${membro.name ?? membro.email}? Ela perde acesso até ser reativada.`}
                action={suspenderMembro.bind(null, membro.id)}
              />
            ) : (
              <form action={reativarMembro.bind(null, membro.id)}>
                <button type="submit">Reativar</button>
              </form>
            )}
            <BotaoComConfirmacao
              label="Deletar"
              mensagemConfirmacao={`Deletar ${membro.name ?? membro.email} permanentemente? Essa ação não pode ser desfeita.`}
              action={deletarMembro.bind(null, membro.id)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
