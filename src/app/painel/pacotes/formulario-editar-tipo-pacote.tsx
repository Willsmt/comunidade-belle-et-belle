"use client";

import { editarTipoPacote } from "./actions";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FormularioEditarTipoPacote({
  id,
  nome,
  itensAtuais,
  opcoesTipoSessao,
  onCancelar,
}: {
  id: string;
  nome: string;
  itensAtuais: { tipoSessaoId: string; quantidade: number }[];
  opcoesTipoSessao: { id: string; nome: string; ativo: boolean }[];
  onCancelar: () => void;
}) {
  const { isPending, erro, executar } = useAcaoComErro();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    executar(async () => {
      await editarTipoPacote(formData);
      onCancelar();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Editar tipo de pacote"
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="id" value={id} />
      <label
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
        htmlFor={`nome-editar-${id}`}
      >
        Nome do pacote
        <Input id={`nome-editar-${id}`} name="nome" type="text" defaultValue={nome} required />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-foreground">
          Quantidade por tipo de sessão (deixe em branco para não incluir)
        </legend>
        {opcoesTipoSessao.map((tipoSessao) => {
          const itemAtual = itensAtuais.find((item) => item.tipoSessaoId === tipoSessao.id);
          return (
            <label
              key={tipoSessao.id}
              className="flex items-center justify-between gap-3 text-sm text-foreground"
              htmlFor={`quantidade-editar-${id}-${tipoSessao.id}`}
            >
              {tipoSessao.nome}
              {!tipoSessao.ativo && " (arquivado)"}
              <Input
                id={`quantidade-editar-${id}-${tipoSessao.id}`}
                name={`quantidade-${tipoSessao.id}`}
                type="number"
                min="1"
                step="1"
                defaultValue={itemAtual?.quantidade}
                className="w-20"
              />
            </label>
          );
        })}
      </fieldset>

      {erro && (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar"}
        </Button>
        <Button type="button" variant="ghost" disabled={isPending} onClick={onCancelar}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
