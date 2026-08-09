"use client";

import { participarDesafioSurpresa } from "./actions";
import { Button } from "@/components/ui/button";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";

export function FormularioParticiparSurpresa({
  surpresaId,
  titulo,
  exigeComprovacao,
}: {
  surpresaId: string;
  titulo: string;
  exigeComprovacao: boolean;
}) {
  const { isPending, erro, executar } = useAcaoComErro();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    executar(() => participarDesafioSurpresa(surpresaId, formData));
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label={`Participar de ${titulo}`}
      className="flex flex-col gap-2"
    >
      {exigeComprovacao && (
        <label
          htmlFor={`comprovacao-${surpresaId}`}
          className="flex flex-col gap-1 text-sm font-medium text-foreground"
        >
          Foto de comprovação
          <input
            id={`comprovacao-${surpresaId}`}
            name="comprovacao"
            type="file"
            accept="image/*"
            required
            className="text-xs text-muted-foreground file:mr-2 file:rounded-lg file:border-0 file:bg-secondary file:px-2 file:py-1 file:text-xs file:font-medium file:text-secondary-foreground"
          />
        </label>
      )}
      {erro && <p role="alert">{erro}</p>}
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Enviando..." : "Participar"}
      </Button>
    </form>
  );
}
