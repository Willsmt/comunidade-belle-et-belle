"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { atualizarPerfil } from "./actions";
import type { Perfil } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FormularioPerfil({
  perfil,
  nome,
  fotoUrl,
}: {
  perfil: Perfil | null;
  nome: string | null;
  fotoUrl: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [nomeValor, setNomeValor] = useState(nome ?? "");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setSucesso(false);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        await atualizarPerfil(formData);
        router.refresh();
        setSucesso(true);
      } catch {
        setErro("Não foi possível salvar o perfil.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Editar perfil" className="flex flex-col gap-4">
      {fotoUrl && (
        <img
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
        htmlFor="nome"
      >
        Nome de exibição
        <Input
          type="text"
          id="nome"
          name="nome"
          required
          value={nomeValor}
          onChange={(event) => setNomeValor(event.target.value)}
        />
      </label>
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

      {sucesso && (
        <p role="status" className="text-sm text-primary">
          Perfil atualizado.
        </p>
      )}
    </form>
  );
}
