"use client";

import { criarTipoPacote } from "./actions";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FormularioCriarTipoPacote({
  tiposSessao,
}: {
  tiposSessao: { id: string; nome: string }[];
}) {
  const { isPending, erro, executar } = useAcaoComErro();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    executar(() => criarTipoPacote(formData));
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Criar tipo de pacote"
      className="flex flex-col gap-4"
    >
      <label
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
        htmlFor="nome-tipo-pacote"
      >
        Nome do pacote
        <Input id="nome-tipo-pacote" name="nome" type="text" required />
      </label>

      {tiposSessao.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Cadastre ao menos um tipo de sessão antes de criar um tipo de pacote.
        </p>
      ) : (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-foreground">
            Quantidade por tipo de sessão (deixe em branco para não incluir)
          </legend>
          {tiposSessao.map((tipoSessao) => (
            <label
              key={tipoSessao.id}
              className="flex items-center justify-between gap-3 text-sm text-foreground"
              htmlFor={`quantidade-${tipoSessao.id}`}
            >
              {tipoSessao.nome}
              <Input
                id={`quantidade-${tipoSessao.id}`}
                name={`quantidade-${tipoSessao.id}`}
                type="number"
                min="1"
                step="1"
                className="w-20"
              />
            </label>
          ))}
        </fieldset>
      )}

      {erro && (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}
      <Button type="submit" disabled={isPending || tiposSessao.length === 0}>
        {isPending ? "Criando..." : "Criar tipo de pacote"}
      </Button>
    </form>
  );
}
