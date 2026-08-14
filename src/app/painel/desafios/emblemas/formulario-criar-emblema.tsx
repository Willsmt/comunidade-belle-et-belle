"use client";
import { useState } from "react";
import { criarEmblema } from "./actions";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ICONES_EMBLEMA,
  NOMES_ICONE_EMBLEMA,
  type NomeIconeEmblema,
} from "@/lib/emblemas/icones";

export function FormularioCriarEmblema() {
  const { isPending, erro, executar } = useAcaoComErro();
  const [iconeSelecionado, setIconeSelecionado] = useState<NomeIconeEmblema | null>(
    null,
  );

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
      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm font-medium text-foreground">Ícone</legend>
        <input type="hidden" name="icone" value={iconeSelecionado ?? ""} />
        <div
          className="flex flex-wrap gap-2"
          role="radiogroup"
          aria-label="Ícone do emblema"
        >
          {NOMES_ICONE_EMBLEMA.map((nome) => {
            const Icone = ICONES_EMBLEMA[nome];
            const selecionado = iconeSelecionado === nome;
            return (
              <button
                key={nome}
                type="button"
                role="radio"
                aria-checked={selecionado}
                aria-label={nome}
                onClick={() => setIconeSelecionado(selecionado ? null : nome)}
                className={cn(
                  "flex size-10 items-center justify-center rounded-md border transition-colors",
                  selecionado
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input text-muted-foreground hover:bg-accent",
                )}
              >
                <Icone className="size-5" />
              </button>
            );
          })}
        </div>
      </fieldset>
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
