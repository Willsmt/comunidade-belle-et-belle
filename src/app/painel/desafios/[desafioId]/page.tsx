import { notFound } from "next/navigation";
import { obterDesafioComCategorias } from "./queries";
import {
  criarCategoria,
  removerCategoria,
  criarItem,
  removerItem,
  criarRegraLimiar,
  criarRegraCombo,
  criarRegraCategoriaCompleta,
  removerRegraBonus,
  criarDesafioSurpresa,
  removerDesafioSurpresa,
  aprovarParticipacao,
  rejeitarParticipacao,
} from "./actions";
import { BotaoComConfirmacao } from "@/components/painel/botao-com-confirmacao";

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
      <form action={criarCategoria.bind(null, desafioId)} aria-label="Criar categoria">
        <label htmlFor="nome">
          Nome
          <input id="nome" name="nome" type="text" required />
        </label>
        <label htmlFor="cor">
          Cor
          <input id="cor" name="cor" type="color" required />
        </label>
        <button type="submit">Criar categoria</button>
      </form>

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

            <form action={criarItem.bind(null, categoria.id)} aria-label={`Criar item em ${categoria.nome}`}>
              <label htmlFor={`descricao-${categoria.id}`}>
                Descrição
                <input id={`descricao-${categoria.id}`} name="descricao" type="text" required />
              </label>
              <label htmlFor={`pontos-${categoria.id}`}>
                Pontos
                <input id={`pontos-${categoria.id}`} name="pontos" type="number" min="1" required />
              </label>
              <label htmlFor={`frequencia-${categoria.id}`}>
                Frequência
                <select id={`frequencia-${categoria.id}`} name="frequencia" defaultValue="DIARIO">
                  <option value="DIARIO">Diário</option>
                  <option value="SEMANAL">Semanal</option>
                </select>
              </label>
              <button type="submit">Adicionar item</button>
            </form>
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
      <form action={criarRegraLimiar.bind(null, desafioId)} aria-label="Criar regra de limiar diário">
        <label htmlFor="limiarItens">
          Itens no dia
          <input id="limiarItens" name="limiarItens" type="number" min="1" required />
        </label>
        <label htmlFor="pontosExtras-limiar">
          Pontos extras
          <input id="pontosExtras-limiar" name="pontosExtras" type="number" min="1" required />
        </label>
        <button type="submit">Criar regra</button>
      </form>

      <h3>Nova regra: combo</h3>
      <form action={criarRegraCombo.bind(null, desafioId)} aria-label="Criar regra de combo">
        <label htmlFor="itensCombo">
          Itens do combo
          <select id="itensCombo" name="itensCombo" multiple required>
            {desafio.categorias
              .flatMap((categoria) => categoria.itens)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.descricao}
                </option>
              ))}
          </select>
        </label>
        <label htmlFor="pontosExtras-combo">
          Pontos extras
          <input id="pontosExtras-combo" name="pontosExtras" type="number" min="1" required />
        </label>
        <button type="submit">Criar regra</button>
      </form>

      <h3>Nova regra: categoria completa</h3>
      <form
        action={criarRegraCategoriaCompleta.bind(null, desafioId)}
        aria-label="Criar regra de categoria completa"
      >
        <label htmlFor="categoriaId">
          Categoria
          <select id="categoriaId" name="categoriaId" defaultValue="">
            <option value="">Selecione</option>
            {desafio.categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="pontosExtras-categoria">
          Pontos extras
          <input id="pontosExtras-categoria" name="pontosExtras" type="number" min="1" required />
        </label>
        <button type="submit">Criar regra</button>
      </form>

      <h2>Desafios surpresa</h2>
      <form
        action={criarDesafioSurpresa.bind(null, desafioId)}
        aria-label="Criar desafio surpresa"
      >
        <label htmlFor="tituloSurpresa">
          Título
          <input id="tituloSurpresa" name="titulo" type="text" required />
        </label>
        <label htmlFor="descricaoSurpresa">
          Descrição
          <input id="descricaoSurpresa" name="descricao" type="text" />
        </label>
        <label htmlFor="pontosSurpresa">
          Pontos
          <input id="pontosSurpresa" name="pontos" type="number" min="1" required />
        </label>
        <label htmlFor="exigeComprovacao">
          <input id="exigeComprovacao" name="exigeComprovacao" type="checkbox" />
          Exige comprovação (foto)
        </label>
        <button type="submit">Criar</button>
      </form>

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
                        <form action={aprovarParticipacao.bind(null, participacao.id)}>
                          <button type="submit">Aprovar</button>
                        </form>
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
