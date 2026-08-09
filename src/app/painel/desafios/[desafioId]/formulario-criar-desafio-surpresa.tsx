"use client";

import { criarDesafioSurpresa } from "./actions";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FormularioCriarDesafioSurpresa({ desafioId }: { desafioId: string }) {
  const { isPending, erro, executar } = useAcaoComErro();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    executar(() => criarDesafioSurpresa(desafioId, formData));
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Criar desafio surpresa"
      className="flex flex-col gap-4"
    >
      <label
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
        htmlFor="tituloSurpresa"
      >
        Título
        <Input id="tituloSurpresa" name="titulo" type="text" required />
      </label>
      <label
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
        htmlFor="descricaoSurpresa"
      >
        Descrição
        <Input id="descricaoSurpresa" name="descricao" type="text" />
      </label>
      <label
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
        htmlFor="pontosSurpresa"
      >
        Pontos
        <Input id="pontosSurpresa" name="pontos" type="number" min="1" required />
      </label>
      <label
        className="flex items-center gap-2 text-sm text-foreground"
        htmlFor="exigeComprovacao"
      >
        <input
          id="exigeComprovacao"
          name="exigeComprovacao"
          type="checkbox"
          className="size-4 rounded border-input accent-primary"
        />
        Exige comprovação (foto)
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
