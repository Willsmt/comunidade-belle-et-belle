import { listarEmblemas } from "./queries";
import { criarEmblema, removerEmblema } from "./actions";
import { BotaoComConfirmacao } from "@/components/painel/botao-com-confirmacao";

export default async function EmblemasPage() {
  const emblemas = await listarEmblemas();

  return (
    <section>
      <h1>Emblemas</h1>

      <h2>Novo emblema</h2>
      <form action={criarEmblema} aria-label="Criar emblema">
        <label htmlFor="nome">
          Nome
          <input id="nome" name="nome" type="text" required />
        </label>
        <label htmlFor="icone">
          Ícone
          <input id="icone" name="icone" type="text" />
        </label>
        <label htmlFor="descricao">
          Descrição
          <input id="descricao" name="descricao" type="text" />
        </label>
        <button type="submit">Criar</button>
      </form>

      <h2>Catálogo</h2>
      {emblemas.length === 0 ? (
        <p>Nenhum emblema criado ainda.</p>
      ) : (
        <ul>
          {emblemas.map((emblema) => (
            <li key={emblema.id}>
              <span>{emblema.nome}</span>
              {emblema.descricao && <span>{emblema.descricao}</span>}
              <BotaoComConfirmacao
                label="Remover"
                mensagemConfirmacao={`Remover o emblema "${emblema.nome}"? Isso só é possível se ele nunca foi atribuído a ninguém.`}
                action={removerEmblema.bind(null, emblema.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
