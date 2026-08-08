"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { atualizarPerfil } from "./actions";
import type { Perfil } from "@/generated/prisma/client";

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
    <form onSubmit={handleSubmit} aria-label="Editar perfil">
      <label htmlFor="bio">
        Bio / mensagem
        <textarea id="bio" name="bio" defaultValue={perfil?.bio ?? ""} />
      </label>

      <label>
        <input
          type="checkbox"
          name="bioPublica"
          defaultChecked={perfil?.bioPublica ?? false}
        />
        Mostrar minha bio no perfil público
      </label>

      <label>
        <input
          type="checkbox"
          name="emblemasPublicos"
          defaultChecked={perfil?.emblemasPublicos ?? true}
        />
        Mostrar meus emblemas no perfil público
      </label>

      <label>
        <input
          type="checkbox"
          name="medidasPublicas"
          defaultChecked={perfil?.medidasPublicas ?? false}
        />
        Mostrar minhas medidas no perfil público
      </label>

      <button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar"}
      </button>

      {erro && <p role="alert">{erro}</p>}
    </form>
  );
}
