"use client";

import { criarDesafio } from "./actions";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FormularioCriarDesafio() {
  const { isPending, erro, executar } = useAcaoComErro();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    executar(() => criarDesafio(formData));
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Criar desafio" className="flex flex-col gap-4">
      <label
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
        htmlFor="titulo"
      >
        Título
        <Input id="titulo" name="titulo" type="text" required />
      </label>

      <label
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
        htmlFor="fraseMotivacional"
      >
        Frase motivacional
        <Input id="fraseMotivacional" name="fraseMotivacional" type="text" />
      </label>

      <label
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
        htmlFor="dataInicio"
      >
        Data de início
        <Input id="dataInicio" name="dataInicio" type="date" required />
      </label>

      <label
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
        htmlFor="dataFim"
      >
        Data de fim
        <Input id="dataFim" name="dataFim" type="date" required />
      </label>

      {erro && (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Criando..." : "Criar"}
      </Button>
    </form>
  );
}
