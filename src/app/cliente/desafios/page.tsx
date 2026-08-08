import { obterDesafioAtivoParaCliente } from "./queries";
import {
  alternarMarcacao,
  participarDesafioSurpresa,
  enviarFotoAntes,
  enviarFotoDepois,
} from "./actions";
import { RankingToggle } from "./ranking-toggle";

export default async function DesafiosClientePage() {
  const resultado = await obterDesafioAtivoParaCliente();

  if (!resultado) {
    return (
      <section>
        <h1>Desafios</h1>
        <p>Nenhum desafio ativo no momento.</p>
      </section>
    );
  }

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

      <section aria-label="Minhas fotos do desafio">
        <h2>Minhas fotos do desafio</h2>
        <div>
          <h3>Antes</h3>
          {fotoAntesUrl ? (
            <img src={fotoAntesUrl} alt="Foto de antes" width={150} />
          ) : (
            <p>Nenhuma foto enviada ainda</p>
          )}
          <form action={enviarFotoAntes} aria-label="Enviar foto de antes">
            <input name="foto" type="file" accept="image/*" required />
            <button type="submit">{fotoAntesUrl ? "Trocar foto" : "Enviar foto"}</button>
          </form>
        </div>
        <div>
          <h3>Depois</h3>
          {fotoDepoisUrl ? (
            <img src={fotoDepoisUrl} alt="Foto de depois" width={150} />
          ) : (
            <p>Nenhuma foto enviada ainda</p>
          )}
          <form action={enviarFotoDepois} aria-label="Enviar foto de depois">
            <input name="foto" type="file" accept="image/*" required />
            <button type="submit">{fotoDepoisUrl ? "Trocar foto" : "Enviar foto"}</button>
          </form>
        </div>
      </section>

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
