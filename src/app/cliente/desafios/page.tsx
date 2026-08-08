import { obterDesafioAtivoParaCliente } from "./queries";
import { alternarMarcacao } from "./actions";

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

  const { desafio, itensMarcadosHoje } = resultado;

  return (
    <section>
      <h1>{desafio.titulo}</h1>
      {desafio.fraseMotivacional && <p>{desafio.fraseMotivacional}</p>}

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
    </section>
  );
}
