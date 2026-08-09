"use client";

import { comentar } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";

export function FormularioComentario({ postId }: { postId: string }) {
  const { isPending, erro, executar } = useAcaoComErro();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    executar(() => comentar(formData));
  }

  return (
    <div className="flex flex-col gap-1">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input type="hidden" name="postId" value={postId} />
        <Input
          type="text"
          name="texto"
          placeholder="Comentar"
          aria-label="Comentar"
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={isPending}>
          Enviar
        </Button>
      </form>
      {erro && <p role="alert">{erro}</p>}
    </div>
  );
}
