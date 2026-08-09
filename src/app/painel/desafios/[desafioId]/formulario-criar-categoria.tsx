"use client";

import { criarCategoria } from "./actions";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FormularioCriarCategoria({ desafioId }: { desafioId: string }) {
  const { isPending, erro, executar } = useAcaoComErro();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    executar(() => criarCategoria(desafioId, formData));
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Criar categoria"
      className="flex flex-col gap-4"
    >
      <label
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
        htmlFor="nome"
      >
        Nome
        <Input id="nome" name="nome" type="text" required />
      </label>
      <label
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
        htmlFor="cor"
      >
        Cor
        <input
          id="cor"
          name="cor"
          type="color"
          required
          className="h-9 w-16 rounded-lg border border-input bg-background p-1"
        />
      </label>
      {erro && (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Criando..." : "Criar categoria"}
      </Button>
    </form>
  );
}
