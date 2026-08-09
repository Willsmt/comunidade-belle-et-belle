"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { atualizarPerfilParceria } from "./actions";
import type { PerfilParceria } from "@/generated/prisma/client";

export function FormularioPerfilParceria({
  perfil,
  fotoUrl,
}: {
  perfil: PerfilParceria | null;
  fotoUrl: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        await atualizarPerfilParceria(formData);
        router.refresh();
      } catch {
        setErro("Não foi possível salvar o perfil.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Editar perfil da parceria">
      {fotoUrl && (
        <img
          src={fotoUrl}
          alt="Foto de perfil atual"
          width={120}
          height={120}
        />
      )}
      <label htmlFor="foto">
        Foto de perfil
        <input
          type="file"
          id="foto"
          name="foto"
          accept="image/jpeg,image/png,image/webp"
        />
      </label>
      <label htmlFor="especialidade">
        Especialidade
        <input
          type="text"
          id="especialidade"
          name="especialidade"
          defaultValue={perfil?.especialidade ?? ""}
        />
      </label>
      <label htmlFor="bio">
        Bio
        <textarea id="bio" name="bio" defaultValue={perfil?.bio ?? ""} />
      </label>
      <button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar"}
      </button>
      {erro && <p role="alert">{erro}</p>}
    </form>
  );
}
