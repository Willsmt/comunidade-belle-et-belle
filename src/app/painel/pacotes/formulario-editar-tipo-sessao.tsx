"use client";

import { editarTipoSessao } from "./actions";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FormularioEditarTipoSessao({
  id,
  nome,
  onCancelar,
}: {
  id: string;
  nome: string;
  onCancelar: () => void;
}) {
  const { isPending, erro, executar } = useAcaoComErro();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    executar(async () => {
      await editarTipoSessao(formData);
      onCancelar();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Editar tipo de sessão"
      className="flex flex-col gap-2"
    >
      <input type="hidden" name="id" value={id} />
      <Input name="nome" type="text" defaultValue={nome} required />
      {erro && (
        <p role="alert" className="text-xs text-destructive">
          {erro}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={onCancelar}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
