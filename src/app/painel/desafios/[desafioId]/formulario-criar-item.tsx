"use client";

import { criarItem } from "./actions";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <form
      onSubmit={handleSubmit}
      aria-label={`Criar item em ${categoriaNome}`}
      className="mt-3 flex flex-col gap-3"
    >
      <label
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
        htmlFor={`descricao-${categoriaId}`}
      >
        Descrição
        <Input id={`descricao-${categoriaId}`} name="descricao" type="text" required />
      </label>
      <label
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
        htmlFor={`pontos-${categoriaId}`}
      >
        Pontos
        <Input id={`pontos-${categoriaId}`} name="pontos" type="number" min="1" required />
      </label>
      <label
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
        htmlFor={`frequencia-${categoriaId}`}
      >
        Frequência
        <select
          id={`frequencia-${categoriaId}`}
          name="frequencia"
          defaultValue="DIARIO"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="DIARIO">Diário</option>
          <option value="SEMANAL">Semanal</option>
        </select>
      </label>
      {erro && (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Adicionando..." : "Adicionar item"}
      </Button>
    </form>
  );
}
