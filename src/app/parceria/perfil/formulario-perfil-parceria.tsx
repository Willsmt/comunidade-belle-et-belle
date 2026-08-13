"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useTransition } from "react";
import { atualizarPerfilParceria } from "./actions";
import type { PerfilParceria } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <form
      onSubmit={handleSubmit}
      aria-label="Editar perfil da parceria"
      className="flex flex-col gap-4"
    >
      {fotoUrl && (
        <Image
          src={fotoUrl}
          alt="Foto de perfil atual"
          width={96}
          height={96}
          className="size-24 rounded-full object-cover"
        />
      )}
      <label
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
        htmlFor="foto"
      >
        Foto de perfil
        <input
          type="file"
          id="foto"
          name="foto"
          accept="image/jpeg,image/png,image/webp"
          className="text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground"
        />
      </label>
      <label
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
        htmlFor="especialidade"
      >
        Especialidade
        <Input
          type="text"
          id="especialidade"
          name="especialidade"
          defaultValue={perfil?.especialidade ?? ""}
        />
      </label>
      <label
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
        htmlFor="bio"
      >
        Bio
        <textarea
          id="bio"
          name="bio"
          defaultValue={perfil?.bio ?? ""}
          rows={4}
          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </label>
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
