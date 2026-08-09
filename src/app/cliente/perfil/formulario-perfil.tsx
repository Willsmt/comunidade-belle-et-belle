"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { atualizarPerfil } from "./actions";
import type { Perfil } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";

export function FormularioPerfil({ perfil }: { perfil: Perfil | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        await atualizarPerfil(formData);
        router.refresh();
      } catch {
        setErro("Não foi possível salvar o perfil.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Editar perfil" className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground" htmlFor="bio">
        Bio / mensagem
        <textarea
          id="bio"
          name="bio"
          defaultValue={perfil?.bio ?? ""}
          rows={4}
          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </label>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            name="bioPublica"
            defaultChecked={perfil?.bioPublica ?? false}
            className="size-4 rounded border-input accent-primary"
          />
          Mostrar minha bio no perfil público
        </label>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            name="emblemasPublicos"
            defaultChecked={perfil?.emblemasPublicos ?? true}
            className="size-4 rounded border-input accent-primary"
          />
          Mostrar meus emblemas no perfil público
        </label>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            name="medidasPublicas"
            defaultChecked={perfil?.medidasPublicas ?? false}
            className="size-4 rounded border-input accent-primary"
          />
          Mostrar minhas medidas no perfil público
        </label>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar"}
      </Button>

      {erro && (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}
    </form>
  );
}
