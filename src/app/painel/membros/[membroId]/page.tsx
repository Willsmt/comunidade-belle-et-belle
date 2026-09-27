import { notFound } from "next/navigation";
import { obterMembro, obterCicloAtivo, listarHistoricoCiclos } from "./queries";
import { listarTiposPacote } from "../../pacotes/queries";
import { FormularioVincularPacote } from "./formulario-vincular-pacote";
import { BotaoMarcarSessao } from "./botao-marcar-sessao";
import { BotaoDesfazerSessao } from "./botao-desfazer-sessao";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function MembroPacotePage({
  params,
}: {
  params: Promise<{ membroId: string }>;
}) {
  const { membroId } = await params;

  const [membro, cicloAtivo, tiposPacote, historicoCiclos] = await Promise.all([
    obterMembro(membroId),
    obterCicloAtivo(membroId),
    listarTiposPacote(),
    listarHistoricoCiclos(membroId),
  ]);

  if (!membro) {
    notFound();
  }

  const opcoesTiposPacote = tiposPacote
    .filter((tipoPacote) => tipoPacote.ativo)
    .map((tipoPacote) => ({
      id: tipoPacote.id,
      nome: tipoPacote.nome,
    }));

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6">
      <h1 className="font-heading text-2xl text-foreground">
        Pacote de sessões — {membro.name ?? membro.email}
      </h1>

      {!cicloAtivo ? (
        <>
          <p className="mt-4 text-sm text-muted-foreground">
            Esta cliente não tem nenhum pacote de sessões ativo.
          </p>
          <Card className="mt-4">
            <CardContent>
              <FormularioVincularPacote
                clienteId={membroId}
                tiposPacote={opcoesTiposPacote}
              />
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>{cicloAtivo.nomePacote}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {cicloAtivo.itens.map((item) => (
                <div key={item.tipoSessaoId} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-foreground">
                    {item.tipoSessaoNome}: {item.quantidadeRealizada}/{item.quantidadeContratada}
                  </span>
                  <BotaoMarcarSessao
                    cicloPacoteId={cicloAtivo.id}
                    tipoSessaoId={item.tipoSessaoId}
                    limiteAtingido={item.quantidadeRealizada >= item.quantidadeContratada}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <h2 className="mt-6 font-heading text-lg text-foreground">Renovar pacote</h2>
          <Card className="mt-2">
            <CardContent>
              <FormularioVincularPacote
                clienteId={membroId}
                tiposPacote={opcoesTiposPacote}
                cicloAtivo={cicloAtivo}
              />
            </CardContent>
          </Card>

          <h2 className="mt-6 font-heading text-lg text-foreground">
            Sessões realizadas neste ciclo
          </h2>
          {cicloAtivo.sessoes.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Nenhuma sessão marcada ainda.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {cicloAtivo.sessoes.map((sessao) => (
                <li key={sessao.id} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-foreground">
                    {sessao.tipoSessaoNome} — {sessao.data.toLocaleDateString("pt-BR")}
                  </span>
                  <BotaoDesfazerSessao sessaoRealizadaId={sessao.id} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <h2 className="mt-6 font-heading text-lg text-foreground">Histórico de sessões</h2>
      {historicoCiclos.every((ciclo) => ciclo.sessoes.length === 0) ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Nenhuma sessão realizada registrada ainda.
        </p>
      ) : (
        <ul className="mt-2 flex flex-col gap-4">
          {historicoCiclos
            .filter((ciclo) => ciclo.sessoes.length > 0)
            .map((ciclo) => (
              <li key={ciclo.id}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{ciclo.nomePacote}</span>
                  <Badge variant={ciclo.ativo ? "secondary" : "outline"}>
                    {ciclo.ativo ? "Ciclo ativo" : "Ciclo arquivado"}
                  </Badge>
                </div>
                <ul className="mt-1 flex flex-col gap-1">
                  {ciclo.sessoes.map((sessao) => (
                    <li key={sessao.id} className="text-sm text-muted-foreground">
                      {sessao.tipoSessaoNome} — {sessao.data.toLocaleDateString("pt-BR")}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
        </ul>
      )}
    </main>
  );
}
