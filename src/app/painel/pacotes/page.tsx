import { listarTiposSessao, listarTiposPacote } from "./queries";
import { FormularioCriarTipoSessao } from "./formulario-criar-tipo-sessao";
import { FormularioCriarTipoPacote } from "./formulario-criar-tipo-pacote";
import { LinhaTipoSessao } from "./linha-tipo-sessao";
import { LinhaTipoPacote } from "./linha-tipo-pacote";
import { Card, CardContent } from "@/components/ui/card";
import { requererAcessoPainelOuRedirecionar } from "@/lib/auth/requerer-acesso-painel";

export default async function PacotesPage() {
  await requererAcessoPainelOuRedirecionar();

  const [tiposSessao, tiposPacote] = await Promise.all([
    listarTiposSessao(),
    listarTiposPacote(),
  ]);
  const tiposSessaoAtivos = tiposSessao.filter((tipoSessao) => tipoSessao.ativo);

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6">
      <h1 className="font-heading text-2xl text-foreground">Pacotes</h1>

      <h2 className="mt-6 font-heading text-lg text-foreground">Tipos de sessão</h2>
      <Card className="mt-2">
        <CardContent>
          <FormularioCriarTipoSessao />
        </CardContent>
      </Card>
      {tiposSessao.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Nenhum tipo de sessão cadastrado ainda.
        </p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {tiposSessao.map((tipoSessao) => (
            <li key={tipoSessao.id}>
              <LinhaTipoSessao tipoSessao={tipoSessao} />
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-6 font-heading text-lg text-foreground">Tipos de pacote</h2>
      <Card className="mt-2">
        <CardContent>
          <FormularioCriarTipoPacote tiposSessao={tiposSessaoAtivos} />
        </CardContent>
      </Card>
      {tiposPacote.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Nenhum tipo de pacote cadastrado ainda.
        </p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {tiposPacote.map((tipoPacote) => (
            <li key={tipoPacote.id}>
              <LinhaTipoPacote tipoPacote={tipoPacote} opcoesTipoSessao={tiposSessaoAtivos} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
