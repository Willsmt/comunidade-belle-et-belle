import Link from "next/link";
import { listarDesafios } from "./queries";
import { encerrarDesafio } from "./actions";
import { BotaoComConfirmacao } from "@/components/botao-com-confirmacao";
import { FormularioCriarDesafio } from "./formulario-criar-desafio";
import { BotaoReabrirDesafio } from "./botao-reabrir-desafio";

export default async function DesafiosPage() {
  const desafios = await listarDesafios();

  return (
    <section>
      <h1>Desafios</h1>

      <Link href="/painel/desafios/emblemas">Gerenciar emblemas</Link>

      <h2>Nova edição</h2>
      <FormularioCriarDesafio />

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
              <Link href={`/painel/desafios/${desafio.id}`}>Gerenciar categorias</Link>

              {desafio.ativo ? (
                <BotaoComConfirmacao
                  label="Encerrar"
                  mensagemConfirmacao={`Encerrar o desafio "${desafio.titulo}"? Ele deixa de ser a edição ativa.`}
                  action={encerrarDesafio.bind(null, desafio.id)}
                />
              ) : (
                <BotaoReabrirDesafio desafioId={desafio.id} />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
