import Image from "next/image";
import { listarPendentes, listarComprovacoesPendentes } from "./queries";
import { rejeitarConta, rejeitarMarcacaoItem } from "./actions";
import { rejeitarParticipacao } from "../desafios/[desafioId]/actions";
import { BotaoAprovarParticipacao } from "../desafios/[desafioId]/botao-aprovar-participacao";
import { BotaoComConfirmacao } from "@/components/botao-com-confirmacao";
import { FotoComZoom } from "@/components/foto-com-zoom";
import { BotaoAprovarConta } from "./botao-aprovar-conta";
import { BotaoAprovarMarcacaoItem } from "./botao-aprovar-marcacao-item";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AprovacoesPage() {
  const [pendentes, { itens, participacoesSurpresa }] = await Promise.all([
    listarPendentes(),
    listarComprovacoesPendentes(),
  ]);

  const semNadaPendente =
    pendentes.length === 0 && itens.length === 0 && participacoesSurpresa.length === 0;

  if (semNadaPendente) {
    return (
      <main className="mx-auto w-full max-w-lg px-4 py-6">
        <h1 className="font-heading text-2xl text-foreground">Aprovações pendentes</h1>
        <p className="mt-6 text-sm text-muted-foreground">
          Nenhum pedido pendente no momento.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6">
      <h1 className="font-heading text-2xl text-foreground">Aprovações pendentes</h1>

      {pendentes.length > 0 && (
        <>
          <h2 className="mt-6 font-heading text-lg text-foreground">Contas</h2>
          <ul className="mt-2 flex flex-col gap-4">
            {pendentes.map((usuario) => (
              <li key={usuario.id}>
                <Card>
                  <CardContent className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-foreground">
                      {usuario.name ?? usuario.email}
                    </span>
                    <div className="flex items-center gap-2">
                      <BotaoAprovarConta userId={usuario.id} />
                      <BotaoComConfirmacao
                        label="Rejeitar"
                        mensagemConfirmacao={`Rejeitar o pedido de ${usuario.name ?? usuario.email}? Essa ação não pode ser desfeita.`}
                        action={rejeitarConta.bind(null, usuario.id)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}

      {itens.length > 0 && (
        <>
          <h2 className="mt-6 font-heading text-lg text-foreground">Comprovações de item</h2>
          <ul className="mt-2 flex flex-col gap-4">
            {itens.map((marcacao) => (
              <li key={marcacao.id}>
                <Card>
                  <CardContent className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {marcacao.cliente.name ?? marcacao.cliente.email}
                      </span>
                      <Badge className="bg-primary text-primary-foreground">
                        {marcacao.item.descricao} · {marcacao.item.pontos} pts
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {marcacao.item.categoria.desafio.titulo}
                    </p>
                    {marcacao.fotoUrl && (
                      <FotoComZoom
                        src={marcacao.fotoUrl}
                        alt="Comprovação enviada pela cliente"
                      >
                        <Image
                          src={marcacao.fotoUrl}
                          alt="Comprovação enviada pela cliente"
                          width={400}
                          height={400}
                          sizes="(min-width: 512px) 400px, 100vw"
                          style={{ width: "100%", height: "auto" }}
                          className="rounded-lg object-cover"
                        />
                      </FotoComZoom>
                    )}
                    <div className="flex items-center gap-2">
                      <BotaoAprovarMarcacaoItem marcacaoId={marcacao.id} />
                      <BotaoComConfirmacao
                        label="Rejeitar"
                        mensagemConfirmacao="Rejeitar essa comprovação? A marcação será removida e a cliente pode marcar de novo."
                        action={rejeitarMarcacaoItem.bind(null, marcacao.id)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}

      {participacoesSurpresa.length > 0 && (
        <>
          <h2 className="mt-6 font-heading text-lg text-foreground">Desafio surpresa</h2>
          <ul className="mt-2 flex flex-col gap-4">
            {participacoesSurpresa.map((participacao) => (
              <li key={participacao.id}>
                <Card>
                  <CardContent className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {participacao.cliente.name ?? participacao.cliente.email}
                      </span>
                      <Badge className="bg-primary text-primary-foreground">
                        {participacao.desafioSurpresa.titulo} ·{" "}
                        {participacao.desafioSurpresa.pontos} pts
                      </Badge>
                    </div>
                    {participacao.fotoUrl && (
                      <FotoComZoom
                        src={participacao.fotoUrl}
                        alt="Comprovação enviada pela cliente"
                      >
                        <Image
                          src={participacao.fotoUrl}
                          alt="Comprovação enviada pela cliente"
                          width={400}
                          height={400}
                          sizes="(min-width: 512px) 400px, 100vw"
                          style={{ width: "100%", height: "auto" }}
                          className="rounded-lg object-cover"
                        />
                      </FotoComZoom>
                    )}
                    <div className="flex items-center gap-2">
                      <BotaoAprovarParticipacao participacaoId={participacao.id} />
                      <BotaoComConfirmacao
                        label="Rejeitar"
                        mensagemConfirmacao="Rejeitar essa participação? Ela será removida e a cliente pode enviar de novo."
                        action={rejeitarParticipacao.bind(null, participacao.id)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
