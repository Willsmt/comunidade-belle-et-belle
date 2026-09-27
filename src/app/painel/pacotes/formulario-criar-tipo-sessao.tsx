"use client";

import { criarTipoSessao } from "./actions";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FormularioCriarTipoSessao() {
  const { isPending, erro, executar } = useAcaoComErro();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    executar(() => criarTipoSessao(formData));
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Criar tipo de sessão"
      className="flex flex-col gap-4"
    >
      <label
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
        htmlFor="nome-tipo-sessao"
      >
        Nome
        <Input id="nome-tipo-sessao" name="nome" type="text" required />
      </label>
      {erro && (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Criando..." : "Criar tipo de sessão"}
      </Button>
    </form>
  );
}
