"use client";

import { criarEmblema } from "./actions";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";

export function FormularioCriarEmblema() {
  const { isPending, erro, executar } = useAcaoComErro();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    executar(() => criarEmblema(formData));
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Criar emblema">
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
      {erro && <p role="alert">{erro}</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? "Criando..." : "Criar"}
      </button>
    </form>
  );
}
