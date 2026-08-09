import { listarEmblemas } from "./queries";
import { removerEmblema } from "./actions";
import { BotaoComConfirmacao } from "@/components/botao-com-confirmacao";
import { FormularioCriarEmblema } from "./formulario-criar-emblema";

export default async function EmblemasPage() {
  const emblemas = await listarEmblemas();

  return (
    <section>
      <h1>Emblemas</h1>

      <h2>Novo emblema</h2>
      <FormularioCriarEmblema />

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
