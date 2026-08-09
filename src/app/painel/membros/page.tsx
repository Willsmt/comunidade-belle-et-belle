import { auth } from "@/auth";
import { contarAdminsGestorasAtivos, listarMembros } from "./queries";
import {
  suspenderMembro,
  reativarMembro,
  deletarMembro,
  promoverAParceria,
  revogarParceria,
} from "./actions";
import { BotaoComConfirmacao } from "@/components/painel/botao-com-confirmacao";

export default async function MembrosPage() {
  const [membros, totalAdminsGestorasAtivos, session] = await Promise.all([
    listarMembros(),
    contarAdminsGestorasAtivos(),
    auth(),
  ]);
  const meuId = session?.user?.id;

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
          const ehVoceMesma = membro.id === meuId;
          const ehAdminOuGestora = membro.papeis.some(
            (p) => p.papel === "ADMIN" || p.papel === "GESTORA",
          );
          const ehUltimaAdminGestoraAtiva =
            ehAdminOuGestora &&
            membro.status === "ATIVO" &&
            totalAdminsGestorasAtivos <= 1;
          const escondeAcoesDeRisco = ehVoceMesma || ehUltimaAdminGestoraAtiva;
          return (
            <li key={membro.id}>
              <span>{membro.name ?? membro.email}</span>
              <span>{membro.status}</span>
              {membro.status === "ATIVO" ? (
                !escondeAcoesDeRisco && (
                  <BotaoComConfirmacao
                    label="Suspender"
                    mensagemConfirmacao={`Suspender ${membro.name ?? membro.email}? Ela perde acesso até ser reativada.`}
                    action={suspenderMembro.bind(null, membro.id)}
                  />
                )
              ) : (
                <form action={reativarMembro.bind(null, membro.id)}>
                  <button type="submit">Reativar</button>
                </form>
              )}
              {eParceria ? (
                <BotaoComConfirmacao
                  label="Revogar Parceria"
                  mensagemConfirmacao={
                    membro._count.vinculosComoParceria > 0
                      ? `Revogar o papel de parceria de ${membro.name ?? membro.email}? Ela perde acesso à área de parceria e os ${membro._count.vinculosComoParceria} vínculo(s) ativo(s) com clientes serão desativados.`
                      : `Revogar o papel de parceria de ${membro.name ?? membro.email}? Ela perde acesso à área de parceria.`
                  }
                  action={revogarParceria.bind(null, membro.id)}
                />
              ) : (
                <form action={promoverAParceria.bind(null, membro.id)}>
                  <button type="submit">Promover a Parceria</button>
                </form>
              )}
              {!escondeAcoesDeRisco && (
                <BotaoComConfirmacao
                  label="Deletar"
                  mensagemConfirmacao={`Deletar ${membro.name ?? membro.email} permanentemente? Essa ação não pode ser desfeita.`}
                  action={deletarMembro.bind(null, membro.id)}
                />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
