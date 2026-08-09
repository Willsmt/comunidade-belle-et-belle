"use client";

import { criarDesafioSurpresa } from "./actions";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";

export function FormularioCriarDesafioSurpresa({ desafioId }: { desafioId: string }) {
  const { isPending, erro, executar } = useAcaoComErro();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    executar(() => criarDesafioSurpresa(desafioId, formData));
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Criar desafio surpresa">
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
      {erro && <p role="alert">{erro}</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? "Criando..." : "Criar"}
      </button>
    </form>
  );
}
