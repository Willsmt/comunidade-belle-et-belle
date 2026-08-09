"use client";

import { criarCategoria } from "./actions";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";

export function FormularioCriarCategoria({ desafioId }: { desafioId: string }) {
  const { isPending, erro, executar } = useAcaoComErro();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    executar(() => criarCategoria(desafioId, formData));
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Criar categoria">
      <label htmlFor="nome">
        Nome
        <input id="nome" name="nome" type="text" required />
      </label>
      <label htmlFor="cor">
        Cor
        <input id="cor" name="cor" type="color" required />
      </label>
      {erro && <p role="alert">{erro}</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? "Criando..." : "Criar categoria"}
      </button>
    </form>
  );
}
