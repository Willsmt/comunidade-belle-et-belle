import Link from "next/link";
import { auth } from "@/auth";
import { temAlgumPapel } from "@/lib/auth/pode-acessar-painel";
import { contarAdminsGestorasAtivos, listarMembros } from "./queries";
import {
  suspenderMembro,
  reativarMembro,
  deletarMembro,
  promoverAParceria,
  revogarParceria,
  promoverAGestora,
  revogarGestora,
} from "./actions";
import { BotaoComConfirmacao } from "@/components/botao-com-confirmacao";
import { BotaoAcaoMembro } from "./botao-acao-membro";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function MembrosPage() {
  const [membros, totalAdminsGestorasAtivos, session] = await Promise.all([
    listarMembros(),
    contarAdminsGestorasAtivos(),
    auth(),
  ]);
  const meuId = session?.user?.id;
  const souAdmin = temAlgumPapel(session?.user?.papeis ?? [], ["ADMIN"]);

  if (membros.length === 0) {
    return (
      <main className="mx-auto w-full max-w-lg px-4 py-6">
        <h1 className="font-heading text-2xl text-foreground">Membros</h1>
        <p className="mt-6 text-sm text-muted-foreground">Nenhum membro ainda.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6">
      <h1 className="font-heading text-2xl text-foreground">Membros</h1>
      <ul className="mt-6 flex flex-col gap-4">
        {membros.map((membro) => {
          const eParceria = membro.papeis.some((p) => p.papel === "PARCERIA");
          const eGestora = membro.papeis.some((p) => p.papel === "GESTORA");
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
              <Card>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">
                      <Link href={`/perfil/${membro.id}`} className="hover:underline">
                        {membro.name ?? membro.email}
                      </Link>
                    </span>
                    <Badge variant={membro.status === "ATIVO" ? "secondary" : "destructive"}>
                      {membro.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-start gap-2">
                    {membro.status === "ATIVO" ? (
                      !escondeAcoesDeRisco && (
                        <BotaoComConfirmacao
                          label="Suspender"
                          mensagemConfirmacao={`Suspender ${membro.name ?? membro.email}? Ela perde acesso até ser reativada.`}
                          action={suspenderMembro.bind(null, membro.id)}
                        />
                      )
                    ) : (
                      <BotaoAcaoMembro
                        label="Reativar"
                        labelPendente="Reativando..."
                        membroId={membro.id}
                        acao={reativarMembro}
                      />
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
                      <BotaoAcaoMembro
                        label="Promover a Parceria"
                        labelPendente="Promovendo..."
                        membroId={membro.id}
                        acao={promoverAParceria}
                      />
                    )}
                    {souAdmin &&
                      (eGestora ? (
                        <BotaoComConfirmacao
                          label="Revogar Gestora"
                          mensagemConfirmacao={`Revogar o papel de gestora de ${membro.name ?? membro.email}? Ela perde acesso ao painel, a menos que também seja ADMIN.`}
                          action={revogarGestora.bind(null, membro.id)}
                        />
                      ) : (
                        <BotaoAcaoMembro
                          label="Promover a Gestora"
                          labelPendente="Promovendo..."
                          membroId={membro.id}
                          acao={promoverAGestora}
                        />
                      ))}
                    {!escondeAcoesDeRisco && (
                      <BotaoComConfirmacao
                        label="Deletar"
                        mensagemConfirmacao={`Deletar ${membro.name ?? membro.email} permanentemente? Essa ação não pode ser desfeita.`}
                        action={deletarMembro.bind(null, membro.id)}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
