import { notFound } from "next/navigation";
import Image from "next/image";
import { obterDesafioComCategorias } from "./queries";
import { listarEmblemas } from "../emblemas/queries";
import {
  removerCategoria,
  removerItem,
  removerRegraBonus,
  removerDesafioSurpresa,
  rejeitarParticipacao,
} from "./actions";
import { BotaoComConfirmacao } from "@/components/botao-com-confirmacao";
import { FormularioCriarCategoria } from "./formulario-criar-categoria";
import { FormularioCriarItem } from "./formulario-criar-item";
import { FormularioCriarRegraLimiar } from "./formulario-criar-regra-limiar";
import { FormularioCriarRegraCombo } from "./formulario-criar-regra-combo";
import { FormularioCriarRegraCategoriaCompleta } from "./formulario-criar-regra-categoria-completa";
import { FormularioCriarDesafioSurpresa } from "./formulario-criar-desafio-surpresa";
import { BotaoAprovarParticipacao } from "./botao-aprovar-participacao";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DesafioDetalhePage({
  params,
}: {
  params: Promise<{ desafioId: string }>;
}) {
  const { desafioId } = await params;
  const desafio = await obterDesafioComCategorias(desafioId);

  if (!desafio) {
    notFound();
  }

  const emblemas = await listarEmblemas();

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-heading text-2xl text-foreground">{desafio.titulo}</h1>
        <Badge variant={desafio.ativo ? "secondary" : "outline"}>
          {desafio.ativo ? "Ativo" : "Encerrado"}
        </Badge>
      </div>

      <h2 className="mt-6 font-heading text-lg text-foreground">Nova categoria</h2>
      <Card className="mt-2">
        <CardContent>
          <FormularioCriarCategoria desafioId={desafioId} />
        </CardContent>
      </Card>

      <h2 className="mt-6 font-heading text-lg text-foreground">Categorias</h2>
      {desafio.categorias.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Nenhuma categoria ainda.</p>
      ) : (
        <div className="mt-2 flex flex-col gap-4">
          {desafio.categorias.map((categoria) => (
            <Card key={categoria.id}>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <h3
                    className="font-heading text-base"
                    style={{ color: categoria.cor }}
                  >
                    {categoria.nome}
                  </h3>
                  <BotaoComConfirmacao
                    label="Remover categoria"
                    mensagemConfirmacao={`Remover a categoria "${categoria.nome}"? Isso remove todos os itens dela e as marcações já feitas.`}
                    action={removerCategoria.bind(null, categoria.id)}
                  />
                </div>

                <div>
                  <h4 className="text-xs font-medium text-muted-foreground">Itens</h4>
                  {categoria.itens.length === 0 ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Nenhum item ainda.
                    </p>
                  ) : (
                    <ul className="mt-1 flex flex-col gap-2">
                      {categoria.itens.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm text-foreground">
                              {item.descricao}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {item.pontos} pts
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {item.frequencia === "DIARIO" ? "Diário" : "Semanal"}
                            </span>
                          </div>
                          <BotaoComConfirmacao
                            label="Remover"
                            mensagemConfirmacao={`Remover o item "${item.descricao}"?`}
                            action={removerItem.bind(null, item.id)}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <FormularioCriarItem categoriaId={categoria.id} categoriaNome={categoria.nome} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <h2 className="mt-6 font-heading text-lg text-foreground">Regras de bônus</h2>
      {desafio.regrasBonus.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Nenhuma regra de bônus ainda.
        </p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {desafio.regrasBonus.map((regra) => (
            <li key={regra.id}>
              <Card>
                <CardContent className="flex items-center justify-between gap-2">
                  {regra.tipo === "LIMIAR_DIARIO" && (
                    <span className="text-sm text-foreground">
                      Completar {regra.limiarItens} itens no dia → +{regra.pontosExtras} pts
                    </span>
                  )}
                  {regra.tipo === "COMBO" && (
                    <span className="text-sm text-foreground">
                      Combo ({regra.itensCombo.map((item) => item.descricao).join(" + ")}) → +
                      {regra.pontosExtras} pts
                    </span>
                  )}
                  {regra.tipo === "CATEGORIA_COMPLETA" && (
                    <span className="text-sm text-foreground">
                      Completar a categoria &quot;
                      {desafio.categorias.find((categoria) => categoria.id === regra.categoriaId)
                        ?.nome ?? "categoria removida"}
                      &quot; → +{regra.pontosExtras} pts
                    </span>
                  )}
                  <BotaoComConfirmacao
                    label="Remover"
                    mensagemConfirmacao="Remover essa regra de bônus?"
                    action={removerRegraBonus.bind(null, regra.id)}
                  />
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <h3 className="mt-6 font-heading text-base text-foreground">
        Nova regra: limiar diário
      </h3>
      <Card className="mt-2">
        <CardContent>
          <FormularioCriarRegraLimiar desafioId={desafioId} emblemas={emblemas} />
        </CardContent>
      </Card>

      <h3 className="mt-6 font-heading text-base text-foreground">Nova regra: combo</h3>
      <Card className="mt-2">
        <CardContent>
          <FormularioCriarRegraCombo
            desafioId={desafioId}
            itens={desafio.categorias.flatMap((categoria) => categoria.itens)}
            emblemas={emblemas}
          />
        </CardContent>
      </Card>

      <h3 className="mt-6 font-heading text-base text-foreground">
        Nova regra: categoria completa
      </h3>
      <Card className="mt-2">
        <CardContent>
          <FormularioCriarRegraCategoriaCompleta
            desafioId={desafioId}
            categorias={desafio.categorias}
            emblemas={emblemas}
          />
        </CardContent>
      </Card>

      <h2 className="mt-6 font-heading text-lg text-foreground">Desafios surpresa</h2>
      <Card className="mt-2">
        <CardContent>
          <FormularioCriarDesafioSurpresa desafioId={desafioId} />
        </CardContent>
      </Card>

      {desafio.desafiosSurpresa.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Nenhum desafio surpresa criado ainda.
        </p>
      ) : (
        <div className="mt-2 flex flex-col gap-4">
          {desafio.desafiosSurpresa.map((surpresa) => (
            <Card key={surpresa.id}>
              <CardContent className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-heading text-base text-foreground">
                    {surpresa.titulo}
                  </h3>
                  <Badge className="bg-primary text-primary-foreground">
                    {surpresa.pontos} pts
                    {surpresa.exigeComprovacao ? " · exige comprovação" : ""}
                  </Badge>
                </div>
                {surpresa.descricao && (
                  <p className="text-sm text-muted-foreground">{surpresa.descricao}</p>
                )}

                <BotaoComConfirmacao
                  label="Remover"
                  mensagemConfirmacao={`Remover o desafio surpresa "${surpresa.titulo}"?`}
                  action={removerDesafioSurpresa.bind(null, surpresa.id)}
                />

                <div>
                  <h4 className="text-xs font-medium text-muted-foreground">
                    Participações
                  </h4>
                  {surpresa.participacoes.length === 0 ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Nenhuma participação ainda.
                    </p>
                  ) : (
                    <ul className="mt-1 flex flex-col gap-2">
                      {surpresa.participacoes.map((participacao) => (
                        <li
                          key={participacao.id}
                          className="flex flex-col gap-2 rounded-lg bg-muted px-3 py-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-foreground">
                              {participacao.cliente.name ?? participacao.cliente.email}
                            </span>
                            {participacao.validado && <Badge variant="secondary">Aprovada</Badge>}
                          </div>
                          {participacao.fotoUrl && (
                            <Image
                              src={participacao.fotoUrl}
                              alt="Comprovação enviada pela cliente"
                              width={400}
                              height={400}
                              sizes="(min-width: 512px) 400px, 100vw"
                              style={{ width: "100%", height: "auto" }}
                              className="rounded-lg object-cover"
                            />
                          )}
                          {!participacao.validado && (
                            <div className="flex items-center gap-2">
                              <BotaoAprovarParticipacao participacaoId={participacao.id} />
                              <BotaoComConfirmacao
                                label="Rejeitar"
                                mensagemConfirmacao="Rejeitar essa participação? Ela será removida e a cliente pode enviar de novo."
                                action={rejeitarParticipacao.bind(null, participacao.id)}
                              />
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
