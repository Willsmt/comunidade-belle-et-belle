"use client";

import { salvarReflexao } from "./actions";
import { Button } from "@/components/ui/button";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";

export function FormularioReflexao({
  reflexaoMudou,
  reflexaoOrgulho,
  reflexaoContinuar,
}: {
  reflexaoMudou: string | null;
  reflexaoOrgulho: string | null;
  reflexaoContinuar: string | null;
}) {
  const { isPending, erro, executar } = useAcaoComErro();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    executar(() => salvarReflexao(formData));
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Salvar reflexão final"
      className="flex flex-col gap-3"
    >
      <label
        htmlFor="reflexaoMudou"
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
      >
        O que mais mudou em mim nesses 30 dias?
        <textarea
          id="reflexaoMudou"
          name="reflexaoMudou"
          defaultValue={reflexaoMudou ?? ""}
          rows={3}
          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </label>
      <label
        htmlFor="reflexaoOrgulho"
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
      >
        Do que mais me orgulho?
        <textarea
          id="reflexaoOrgulho"
          name="reflexaoOrgulho"
          defaultValue={reflexaoOrgulho ?? ""}
          rows={3}
          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </label>
      <label
        htmlFor="reflexaoContinuar"
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
      >
        O que vou continuar fazendo?
        <textarea
          id="reflexaoContinuar"
          name="reflexaoContinuar"
          defaultValue={reflexaoContinuar ?? ""}
          rows={3}
          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </label>
      {erro && <p role="alert">{erro}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar reflexão"}
      </Button>
    </form>
  );
}
