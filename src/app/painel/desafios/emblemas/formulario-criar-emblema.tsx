"use client";

import { criarEmblema } from "./actions";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FormularioCriarEmblema() {
  const { isPending, erro, executar } = useAcaoComErro();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    executar(() => criarEmblema(formData));
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Criar emblema" className="flex flex-col gap-4">
      <label
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
        htmlFor="nome"
      >
        Nome
        <Input id="nome" name="nome" type="text" required />
      </label>
      <label
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
        htmlFor="icone"
      >
        Ícone
        <Input id="icone" name="icone" type="text" />
      </label>
      <label
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
        htmlFor="descricao"
      >
        Descrição
        <Input id="descricao" name="descricao" type="text" />
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
