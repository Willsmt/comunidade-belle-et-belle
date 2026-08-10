"use client";

import { editarPost } from "../../actions";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";
import { Button } from "@/components/ui/button";

export function FormularioEditarPost({
  postId,
  texto,
}: {
  postId: string;
  texto: string;
}) {
  const { isPending, erro, executar } = useAcaoComErro();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    executar(() => editarPost(formData));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="postId" value={postId} />
      <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
        Texto
        <textarea
          name="texto"
          rows={4}
          defaultValue={texto}
          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
        Trocar imagem (opcional)
        <input
          type="file"
          name="arquivo"
          accept="image/jpeg,image/png,image/webp"
          className="text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground"
        />
      </label>
      {erro && (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
