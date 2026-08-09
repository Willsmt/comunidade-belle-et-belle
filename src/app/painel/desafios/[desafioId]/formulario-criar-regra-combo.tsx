"use client";

import { criarRegraCombo } from "./actions";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";

export function FormularioCriarRegraCombo({
  desafioId,
  itens,
}: {
  desafioId: string;
  itens: { id: string; descricao: string }[];
}) {
  const { isPending, erro, executar } = useAcaoComErro();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    executar(() => criarRegraCombo(desafioId, formData));
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Criar regra de combo">
      <label htmlFor="itensCombo">
        Itens do combo
        <select id="itensCombo" name="itensCombo" multiple required>
          {itens.map((item) => (
            <option key={item.id} value={item.id}>
              {item.descricao}
            </option>
          ))}
        </select>
      </label>
      <label htmlFor="pontosExtras-combo">
        Pontos extras
        <input id="pontosExtras-combo" name="pontosExtras" type="number" min="1" required />
      </label>
      {erro && <p role="alert">{erro}</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? "Criando..." : "Criar regra"}
      </button>
    </form>
  );
}
