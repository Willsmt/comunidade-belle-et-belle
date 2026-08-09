import { listarMembros } from "./queries";
import {
  suspenderMembro,
  reativarMembro,
  deletarMembro,
  promoverAParceria,
  revogarParceria,
} from "./actions";
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
        {membros.map((membro) => {
          const eParceria = membro.papeis.some((p) => p.papel === "PARCERIA");
          return (
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
              {eParceria ? (
                <BotaoComConfirmacao
                  label="Revogar Parceria"
                  mensagemConfirmacao={`Revogar o papel de parceria de ${membro.name ?? membro.email}? Ela perde acesso à área de parceria.`}
                  action={revogarParceria.bind(null, membro.id)}
                />
              ) : (
                <form action={promoverAParceria.bind(null, membro.id)}>
                  <button type="submit">Promover a Parceria</button>
                </form>
              )}
              <BotaoComConfirmacao
                label="Deletar"
                mensagemConfirmacao={`Deletar ${membro.name ?? membro.email} permanentemente? Essa ação não pode ser desfeita.`}
                action={deletarMembro.bind(null, membro.id)}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
