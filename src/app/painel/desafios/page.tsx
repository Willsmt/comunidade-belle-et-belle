import { listarDesafios } from "./queries";
import { criarDesafio, encerrarDesafio, reabrirDesafio } from "./actions";
import { BotaoComConfirmacao } from "@/components/painel/botao-com-confirmacao";

export default async function DesafiosPage() {
  const desafios = await listarDesafios();

  return (
    <section>
      <h1>Desafios</h1>

      <h2>Nova edição</h2>
      <form action={criarDesafio} aria-label="Criar desafio">
        <label htmlFor="titulo">
          Título
          <input id="titulo" name="titulo" type="text" required />
        </label>

        <label htmlFor="fraseMotivacional">
          Frase motivacional
          <input id="fraseMotivacional" name="fraseMotivacional" type="text" />
        </label>

        <label htmlFor="dataInicio">
          Data de início
          <input id="dataInicio" name="dataInicio" type="date" required />
        </label>

        <label htmlFor="dataFim">
          Data de fim
          <input id="dataFim" name="dataFim" type="date" required />
        </label>

        <button type="submit">Criar</button>
      </form>

      <h2>Edições</h2>
      {desafios.length === 0 ? (
        <p>Nenhum desafio criado ainda.</p>
      ) : (
        <ul>
          {desafios.map((desafio) => (
            <li key={desafio.id}>
              <span>{desafio.titulo}</span>
              <span>{desafio.ativo ? "Ativo" : "Encerrado"}</span>
              <span>
                {desafio.dataInicio.toLocaleDateString("pt-BR")} –{" "}
                {desafio.dataFim.toLocaleDateString("pt-BR")}
              </span>
              <span>{desafio._count.categorias} categoria(s)</span>

              {desafio.ativo ? (
                <BotaoComConfirmacao
                  label="Encerrar"
                  mensagemConfirmacao={`Encerrar o desafio "${desafio.titulo}"? Ele deixa de ser a edição ativa.`}
                  action={encerrarDesafio.bind(null, desafio.id)}
                />
              ) : (
                <form action={reabrirDesafio.bind(null, desafio.id)}>
                  <button type="submit">Reabrir</button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
