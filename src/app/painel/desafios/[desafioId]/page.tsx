import { notFound } from "next/navigation";
import { obterDesafioComCategorias } from "./queries";
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

  return (
    <section>
      <h1>{desafio.titulo}</h1>
      <p>{desafio.ativo ? "Ativo" : "Encerrado"}</p>

      <h2>Nova categoria</h2>
      <FormularioCriarCategoria desafioId={desafioId} />

      <h2>Categorias</h2>
      {desafio.categorias.length === 0 ? (
        <p>Nenhuma categoria ainda.</p>
      ) : (
        desafio.categorias.map((categoria) => (
          <div key={categoria.id}>
            <h3 style={{ color: categoria.cor }}>{categoria.nome}</h3>
            <BotaoComConfirmacao
              label="Remover categoria"
              mensagemConfirmacao={`Remover a categoria "${categoria.nome}"? Isso remove todos os itens dela e as marcações já feitas.`}
              action={removerCategoria.bind(null, categoria.id)}
            />

            <h4>Itens</h4>
            {categoria.itens.length === 0 ? (
              <p>Nenhum item ainda.</p>
            ) : (
              <ul>
                {categoria.itens.map((item) => (
                  <li key={item.id}>
                    <span>{item.descricao}</span>
                    <span>{item.pontos} pts</span>
                    <span>{item.frequencia === "DIARIO" ? "Diário" : "Semanal"}</span>
                    <BotaoComConfirmacao
                      label="Remover"
                      mensagemConfirmacao={`Remover o item "${item.descricao}"?`}
                      action={removerItem.bind(null, item.id)}
                    />
                  </li>
                ))}
              </ul>
            )}

            <FormularioCriarItem categoriaId={categoria.id} categoriaNome={categoria.nome} />
          </div>
        ))
      )}

      <h2>Regras de bônus</h2>
      {desafio.regrasBonus.length === 0 ? (
        <p>Nenhuma regra de bônus ainda.</p>
      ) : (
        <ul>
          {desafio.regrasBonus.map((regra) => (
            <li key={regra.id}>
              {regra.tipo === "LIMIAR_DIARIO" && (
                <span>
                  Completar {regra.limiarItens} itens no dia → +{regra.pontosExtras} pts
                </span>
              )}
              {regra.tipo === "COMBO" && (
                <span>
                  Combo ({regra.itensCombo.map((item) => item.descricao).join(" + ")}) → +
                  {regra.pontosExtras} pts
                </span>
              )}
              {regra.tipo === "CATEGORIA_COMPLETA" && (
                <span>
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
            </li>
          ))}
        </ul>
      )}

      <h3>Nova regra: limiar diário</h3>
      <FormularioCriarRegraLimiar desafioId={desafioId} />

      <h3>Nova regra: combo</h3>
      <FormularioCriarRegraCombo
        desafioId={desafioId}
        itens={desafio.categorias.flatMap((categoria) => categoria.itens)}
      />

      <h3>Nova regra: categoria completa</h3>
      <FormularioCriarRegraCategoriaCompleta
        desafioId={desafioId}
        categorias={desafio.categorias}
      />

      <h2>Desafios surpresa</h2>
      <FormularioCriarDesafioSurpresa desafioId={desafioId} />

      {desafio.desafiosSurpresa.length === 0 ? (
        <p>Nenhum desafio surpresa criado ainda.</p>
      ) : (
        desafio.desafiosSurpresa.map((surpresa) => (
          <div key={surpresa.id}>
            <h3>{surpresa.titulo}</h3>
            {surpresa.descricao && <p>{surpresa.descricao}</p>}
            <p>
              {surpresa.pontos} pts{surpresa.exigeComprovacao ? " · exige comprovação" : ""}
            </p>
            <BotaoComConfirmacao
              label="Remover"
              mensagemConfirmacao={`Remover o desafio surpresa "${surpresa.titulo}"?`}
              action={removerDesafioSurpresa.bind(null, surpresa.id)}
            />

            <h4>Participações</h4>
            {surpresa.participacoes.length === 0 ? (
              <p>Nenhuma participação ainda.</p>
            ) : (
              <ul>
                {surpresa.participacoes.map((participacao) => (
                  <li key={participacao.id}>
                    <span>{participacao.cliente.name ?? participacao.cliente.email}</span>
                    {participacao.validado ? (
                      <span>Aprovada</span>
                    ) : (
                      <>
                        <BotaoAprovarParticipacao participacaoId={participacao.id} />
                        <BotaoComConfirmacao
                          label="Rejeitar"
                          mensagemConfirmacao="Rejeitar essa participação? Ela será removida e a cliente pode enviar de novo."
                          action={rejeitarParticipacao.bind(null, participacao.id)}
                        />
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))
      )}
    </section>
  );
}
