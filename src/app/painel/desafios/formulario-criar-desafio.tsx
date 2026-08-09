"use client";

import { criarDesafio } from "./actions";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";

export function FormularioCriarDesafio() {
  const { isPending, erro, executar } = useAcaoComErro();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    executar(() => criarDesafio(formData));
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Criar desafio">
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

      {erro && <p role="alert">{erro}</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? "Criando..." : "Criar"}
      </button>
    </form>
  );
}
