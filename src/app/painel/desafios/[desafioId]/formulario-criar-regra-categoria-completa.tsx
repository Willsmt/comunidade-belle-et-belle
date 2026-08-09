"use client";

import { criarRegraCategoriaCompleta } from "./actions";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";

export function FormularioCriarRegraCategoriaCompleta({
  desafioId,
  categorias,
}: {
  desafioId: string;
  categorias: { id: string; nome: string }[];
}) {
  const { isPending, erro, executar } = useAcaoComErro();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    executar(() => criarRegraCategoriaCompleta(desafioId, formData));
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Criar regra de categoria completa">
      <label htmlFor="categoriaId">
        Categoria
        <select id="categoriaId" name="categoriaId" defaultValue="">
          <option value="">Selecione</option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nome}
            </option>
          ))}
        </select>
      </label>
      <label htmlFor="pontosExtras-categoria">
        Pontos extras
        <input id="pontosExtras-categoria" name="pontosExtras" type="number" min="1" required />
      </label>
      {erro && <p role="alert">{erro}</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? "Criando..." : "Criar regra"}
      </button>
    </form>
  );
}
