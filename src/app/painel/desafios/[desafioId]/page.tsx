import { notFound } from "next/navigation";
import { obterDesafioComCategorias } from "./queries";
import { criarCategoria, removerCategoria, criarItem, removerItem } from "./actions";
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
    </section>
  );
}
