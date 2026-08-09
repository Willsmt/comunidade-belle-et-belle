"use client";

import { editarPost } from "../../actions";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";

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
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="postId" value={postId} />
      <label>
        Texto
        <textarea name="texto" rows={4} defaultValue={texto} />
      </label>
      <label>
        Trocar imagem (opcional)
        <input type="file" name="arquivo" accept="image/jpeg,image/png,image/webp" />
      </label>
      {erro && <p role="alert">{erro}</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}
