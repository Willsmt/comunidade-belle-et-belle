"use client";

import { criarItem } from "./actions";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";

export function FormularioCriarItem({
  categoriaId,
  categoriaNome,
}: {
  categoriaId: string;
  categoriaNome: string;
}) {
  const { isPending, erro, executar } = useAcaoComErro();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    executar(() => criarItem(categoriaId, formData));
  }

  return (
    <form onSubmit={handleSubmit} aria-label={`Criar item em ${categoriaNome}`}>
      <label htmlFor={`descricao-${categoriaId}`}>
        Descrição
        <input id={`descricao-${categoriaId}`} name="descricao" type="text" required />
      </label>
      <label htmlFor={`pontos-${categoriaId}`}>
        Pontos
        <input id={`pontos-${categoriaId}`} name="pontos" type="number" min="1" required />
      </label>
      <label htmlFor={`frequencia-${categoriaId}`}>
        Frequência
        <select id={`frequencia-${categoriaId}`} name="frequencia" defaultValue="DIARIO">
          <option value="DIARIO">Diário</option>
          <option value="SEMANAL">Semanal</option>
        </select>
      </label>
      {erro && <p role="alert">{erro}</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? "Adicionando..." : "Adicionar item"}
      </button>
    </form>
  );
}
