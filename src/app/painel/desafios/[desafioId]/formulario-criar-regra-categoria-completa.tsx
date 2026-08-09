"use client";

import { criarRegraCategoriaCompleta } from "./actions";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <form
      onSubmit={handleSubmit}
      aria-label="Criar regra de categoria completa"
      className="flex flex-col gap-4"
    >
      <label
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
        htmlFor="categoriaId"
      >
        Categoria
        <select
          id="categoriaId"
          name="categoriaId"
          defaultValue=""
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Selecione</option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nome}
            </option>
          ))}
        </select>
      </label>
      <label
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
        htmlFor="pontosExtras-categoria"
      >
        Pontos extras
        <Input id="pontosExtras-categoria" name="pontosExtras" type="number" min="1" required />
      </label>
      {erro && (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Criando..." : "Criar regra"}
      </Button>
    </form>
  );
}
