import { Gift, PartyPopper, Sparkles, Download } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  podeAcessarAreaCliente,
  podeAcessarDesafiosCliente,
} from "@/lib/auth/pode-acessar-painel";
import { obterDesafioAtivoParaCliente, obterFluxoEncerramento } from "./queries";
import { RankingToggle } from "./ranking-toggle";
import { FotosJornada } from "./fotos-jornada";
import { BotaoMarcarItem } from "./botao-marcar-item";
import { FormularioParticiparSurpresa } from "./formulario-participar-surpresa";
import { BotaoContinuarEncerramento } from "./botao-continuar-encerramento";
import { FormularioReflexao } from "./formulario-reflexao";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DesafiosClientePage() {
  const session = await auth();
  if (!session?.user || !podeAcessarDesafiosCliente(session.user.papeis)) {
    redirect("/");
  }

  // GESTORA/ADMIN veem esta página em modo leitura: ranking e estado do
  // desafio, sem nenhum botão/form de ação (marcar item, participar,
  // reflexão, fotos da própria jornada etc.), que só fazem sentido pra
  // quem tem papel CLIENTE.
  const ehCliente = podeAcessarAreaCliente(session.user.papeis);

  const resultado = await obterDesafioAtivoParaCliente();

  if (resultado) {
    const {
      desafio,
      itensMarcadosHoje,
      rankingSemanal,
      rankingGeral,
      clienteId,
      fotoAntesUrl,
      fotoDepoisUrl,
    } = resultado;

    return (
      <main className="mx-auto w-full max-w-lg px-4 py-6">
        <h1 className="font-heading text-2xl text-foreground">{desafio.titulo}</h1>
        {desafio.fraseMotivacional && (
          <p className="mt-1 text-sm text-muted-foreground">{desafio.fraseMotivacional}</p>
        )}

        <RankingToggle
          rankingSemanal={rankingSemanal}
          rankingGeral={rankingGeral}
          clienteId={clienteId}
        />

        {ehCliente && (
          <FotosJornada fotoAntesUrl={fotoAntesUrl} fotoDepoisUrl={fotoDepoisUrl} />
        )}

        {desafio.categorias.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Esse desafio ainda não tem categorias.
          </p>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            {desafio.categorias.map((categoria) => (
              <Card key={categoria.id}>
                <CardHeader>
                  <CardTitle style={{ color: categoria.cor }}>{categoria.nome}</CardTitle>
                </CardHeader>
                <CardContent>
                  {categoria.itens.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum item nessa categoria.</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {categoria.itens.map((item) => {
                        const marcado = itensMarcadosHoje.has(item.id);
                        return (
                          <li
                            key={item.id}
                            className="flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2"
                          >
                            <div className="flex flex-col">
                              <span className="text-sm text-foreground">{item.descricao}</span>
                              <span className="text-xs text-muted-foreground">
                                {item.pontos} pts
                              </span>
                            </div>
                            {ehCliente && (
                              <BotaoMarcarItem itemId={item.id} marcado={marcado} />
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <h2 className="mt-6 flex items-center gap-1.5 font-heading text-lg text-foreground">
          <Gift className="size-4 text-primary" />
          Desafios surpresa
        </h2>
        {desafio.desafiosSurpresa.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Nenhum desafio surpresa no momento.
          </p>
        ) : (
          <div className="mt-2 flex flex-col gap-4">
            {desafio.desafiosSurpresa.map((surpresa) => {
              const participacao = surpresa.participacoes[0];
              return (
                <Card key={surpresa.id}>
                  <CardContent className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-heading text-base text-foreground">
                        {surpresa.titulo}
                      </h3>
                      <Badge className="bg-primary text-primary-foreground">
                        {surpresa.pontos} pts
                      </Badge>
                    </div>
                    {surpresa.descricao && (
                      <p className="text-sm text-muted-foreground">{surpresa.descricao}</p>
                    )}

                    {ehCliente &&
                      (participacao ? (
                        <p className="text-sm font-medium text-accent-foreground">
                          {participacao.validado
                            ? "Participação aprovada ✓"
                            : "Aguardando validação da Patty"}
                        </p>
                      ) : (
                        <FormularioParticiparSurpresa
                          surpresaId={surpresa.id}
                          titulo={surpresa.titulo}
                          exigeComprovacao={surpresa.exigeComprovacao}
                        />
                      ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    );
  }

  const encerramento = await obterFluxoEncerramento();

  if (!encerramento) {
    return (
      <main className="mx-auto w-full max-w-lg px-4 py-6">
        <h1 className="font-heading text-2xl text-foreground">Desafios</h1>
        <p className="mt-2 text-sm text-muted-foreground">Nenhum desafio ativo no momento.</p>
      </main>
    );
  }

  const {
    desafio,
    clienteId,
    avisoVisto,
    reflexaoMudou,
    reflexaoOrgulho,
    reflexaoContinuar,
    fotoAntesUrl,
    fotoDepoisUrl,
    rankingGeral,
  } = encerramento;

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6">
      <h1 className="font-heading text-2xl text-foreground">{desafio.titulo}</h1>

      {ehCliente && !avisoVisto && (
        <Card
          className="mt-4 border-primary/30 bg-secondary/60"
          aria-label="Aviso de encerramento"
        >
          <CardContent className="flex flex-col items-center gap-2 text-center">
            <PartyPopper className="size-6 text-primary" />
            <h2 className="font-heading text-lg text-foreground">O desafio terminou! 🎉</h2>
            <p className="text-sm text-muted-foreground">Confira o ranking final abaixo.</p>
            <BotaoContinuarEncerramento />
          </CardContent>
        </Card>
      )}

      <Card className="mt-4" aria-label="Ranking final">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Sparkles className="size-4 text-primary" />
            Ranking final
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rankingGeral.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ninguém pontuou nesse desafio.</p>
          ) : (
            <ol className="flex flex-col gap-1.5">
              {rankingGeral.map((linha, indice) => {
                const voce = linha.clienteId === clienteId;
                return (
                  <li
                    key={linha.clienteId}
                    className={
                      voce
                        ? "flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5 text-sm text-secondary-foreground"
                        : "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-foreground"
                    }
                  >
                    <span className="w-5 font-heading text-xs text-muted-foreground">
                      {indice + 1}º
                    </span>
                    <span className="flex-1 font-medium">
                      {voce ? (
                        "Você"
                      ) : (
                        <Link href={`/perfil/${linha.clienteId}`} className="hover:underline">
                          {linha.nome}
                        </Link>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">{linha.pontos} pts</span>
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>

      {ehCliente && (
        <>
          <FotosJornada fotoAntesUrl={fotoAntesUrl} fotoDepoisUrl={fotoDepoisUrl} />

          <Card className="mt-4" aria-label="Reflexão final">
            <CardHeader>
              <CardTitle>Reflexão final</CardTitle>
            </CardHeader>
            <CardContent>
              <FormularioReflexao
                reflexaoMudou={reflexaoMudou}
                reflexaoOrgulho={reflexaoOrgulho}
                reflexaoContinuar={reflexaoContinuar}
              />
            </CardContent>
          </Card>

          <Card className="mt-4 border-primary/30 bg-secondary/60" aria-label="Baixar imagem">
            <CardContent className="flex flex-col items-center gap-2 text-center">
              <h2 className="font-heading text-lg text-foreground">
                Baixe sua imagem de comemoração
              </h2>
              <p className="text-sm text-muted-foreground">
                Uma imagem prontinha pra postar, com suas fotos, conquistas e reflexão.
              </p>
              <a
                href="/cliente/desafios/poster"
                download="meu-glow-up.png"
                className={buttonVariants({ size: "sm" })}
              >
                <Download className="size-3.5" />
                Baixar minha imagem
              </a>
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}
