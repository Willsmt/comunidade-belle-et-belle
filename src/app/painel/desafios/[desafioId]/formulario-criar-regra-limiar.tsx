"use client";

import { criarRegraLimiar } from "./actions";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";

export function FormularioCriarRegraLimiar({ desafioId }: { desafioId: string }) {
  const { isPending, erro, executar } = useAcaoComErro();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    executar(() => criarRegraLimiar(desafioId, formData));
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Criar regra de limiar diário">
      <label htmlFor="limiarItens">
        Itens no dia
        <input id="limiarItens" name="limiarItens" type="number" min="1" required />
      </label>
      <label htmlFor="pontosExtras-limiar">
        Pontos extras
        <input id="pontosExtras-limiar" name="pontosExtras" type="number" min="1" required />
      </label>
      {erro && <p role="alert">{erro}</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? "Criando..." : "Criar regra"}
      </button>
    </form>
  );
}
