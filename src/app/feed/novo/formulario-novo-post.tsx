"use client";

import { useRef, useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import { criarPost } from "../actions";
import type { listarFotosEvolucaoDoUsuario } from "../queries";
import { Button } from "@/components/ui/button";

export function FormularioNovoPost({
  fotosEvolucao,
}: {
  fotosEvolucao: Awaited<ReturnType<typeof listarFotosEvolucaoDoUsuario>>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        await criarPost(formData);
      } catch (error) {
        unstable_rethrow(error);
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível publicar o post.",
        );
      }
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
    >
      <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
        Texto (opcional)
        <textarea
          name="texto"
          rows={4}
          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
        Imagem nova (opcional)
        <input
          type="file"
          name="arquivo"
          accept="image/jpeg,image/png,image/webp"
          className="text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground"
        />
      </label>

      {fotosEvolucao.length > 0 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-foreground">
            Ou escolha uma foto de evolução já enviada
          </legend>
          <div className="flex flex-wrap gap-2">
            {fotosEvolucao.map((foto) => (
              <label
                key={foto.id}
                className="cursor-pointer rounded-lg ring-2 ring-transparent has-[:checked]:ring-primary"
              >
                <input
                  type="radio"
                  name="fotoEvolucaoId"
                  value={foto.id}
                  className="sr-only"
                />
                <img
                  src={foto.urlAssinada}
                  alt="Foto de evolução"
                  className="size-20 rounded-lg object-cover"
                />
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {erro && <p role="alert">{erro}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Publicando..." : "Publicar"}
      </Button>
    </form>
  );
}
