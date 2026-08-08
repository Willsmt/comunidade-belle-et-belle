import { obterDesafioAtivoParaCliente, obterFluxoEncerramento } from "./queries";
import {
  alternarMarcacao,
  participarDesafioSurpresa,
  marcarAvisoEncerramentoVisto,
  salvarReflexao,
} from "./actions";
import { RankingToggle } from "./ranking-toggle";
import { FotosJornada } from "./fotos-jornada";

export default async function DesafiosClientePage() {
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
      <section>
        <h1>{desafio.titulo}</h1>
        {desafio.fraseMotivacional && <p>{desafio.fraseMotivacional}</p>}

        <RankingToggle
          rankingSemanal={rankingSemanal}
          rankingGeral={rankingGeral}
          clienteId={clienteId}
        />

        <FotosJornada fotoAntesUrl={fotoAntesUrl} fotoDepoisUrl={fotoDepoisUrl} />

        {desafio.categorias.length === 0 ? (
          <p>Esse desafio ainda não tem categorias.</p>
        ) : (
          desafio.categorias.map((categoria) => (
            <div key={categoria.id}>
              <h2 style={{ color: categoria.cor }}>{categoria.nome}</h2>
              {categoria.itens.length === 0 ? (
                <p>Nenhum item nessa categoria.</p>
              ) : (
                <ul>
                  {categoria.itens.map((item) => {
                    const marcado = itensMarcadosHoje.has(item.id);
                    return (
                      <li key={item.id}>
                        <span>{item.descricao}</span>
                        <span>{item.pontos} pts</span>
                        <form action={alternarMarcacao.bind(null, item.id)}>
                          <button type="submit">{marcado ? "✓ Marcado" : "Marcar"}</button>
                        </form>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))
        )}

        <h2>Desafios surpresa</h2>
        {desafio.desafiosSurpresa.length === 0 ? (
          <p>Nenhum desafio surpresa no momento.</p>
        ) : (
          desafio.desafiosSurpresa.map((surpresa) => {
            const participacao = surpresa.participacoes[0];
            return (
              <div key={surpresa.id}>
                <h3>{surpresa.titulo}</h3>
                {surpresa.descricao && <p>{surpresa.descricao}</p>}
                <p>{surpresa.pontos} pts</p>

                {participacao ? (
                  <p>
                    {participacao.validado
                      ? "Participação aprovada ✓"
                      : "Aguardando validação da Patty"}
                  </p>
                ) : (
                  <form
                    action={participarDesafioSurpresa.bind(null, surpresa.id)}
                    aria-label={`Participar de ${surpresa.titulo}`}
                  >
                    {surpresa.exigeComprovacao && (
                      <label htmlFor={`comprovacao-${surpresa.id}`}>
                        Foto de comprovação
                        <input
                          id={`comprovacao-${surpresa.id}`}
                          name="comprovacao"
                          type="file"
                          accept="image/*"
                          required
                        />
                      </label>
                    )}
                    <button type="submit">Participar</button>
                  </form>
                )}
              </div>
            );
          })
        )}
      </section>
    );
  }

  const encerramento = await obterFluxoEncerramento();

  if (!encerramento) {
    return (
      <section>
        <h1>Desafios</h1>
        <p>Nenhum desafio ativo no momento.</p>
      </section>
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
    <section>
      <h1>{desafio.titulo}</h1>

      {!avisoVisto && (
        <section aria-label="Aviso de encerramento">
          <h2>O desafio terminou! 🎉</h2>
          <p>Confira o ranking final abaixo.</p>
          <form action={marcarAvisoEncerramentoVisto}>
            <button type="submit">Continuar</button>
          </form>
        </section>
      )}

      <section aria-label="Ranking final">
        <h2>Ranking final</h2>
        {rankingGeral.length === 0 ? (
          <p>Ninguém pontuou nesse desafio.</p>
        ) : (
          <ol>
            {rankingGeral.map((linha, indice) => (
              <li key={linha.clienteId}>
                <span>{indice + 1}º</span>
                <span>{linha.clienteId === clienteId ? "Você" : linha.nome}</span>
                <span>{linha.pontos} pts</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <FotosJornada fotoAntesUrl={fotoAntesUrl} fotoDepoisUrl={fotoDepoisUrl} />

      <section aria-label="Reflexão final">
        <h2>Reflexão final</h2>
        <form action={salvarReflexao} aria-label="Salvar reflexão final">
          <label htmlFor="reflexaoMudou">
            O que mais mudou em mim nesses 30 dias?
            <textarea
              id="reflexaoMudou"
              name="reflexaoMudou"
              defaultValue={reflexaoMudou ?? ""}
            />
          </label>
          <label htmlFor="reflexaoOrgulho">
            Do que mais me orgulho?
            <textarea
              id="reflexaoOrgulho"
              name="reflexaoOrgulho"
              defaultValue={reflexaoOrgulho ?? ""}
            />
          </label>
          <label htmlFor="reflexaoContinuar">
            O que vou continuar fazendo?
            <textarea
              id="reflexaoContinuar"
              name="reflexaoContinuar"
              defaultValue={reflexaoContinuar ?? ""}
            />
          </label>
          <button type="submit">Salvar reflexão</button>
        </form>
      </section>
    </section>
  );
}
