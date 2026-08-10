"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { criarRegistroMedida } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FormularioRegistro() {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        await criarRegistroMedida(formData);
        formRef.current?.reset();
        router.refresh();
      } catch {
        setErro(
          "Não foi possível salvar o registro. Preencha ao menos uma medida.",
        );
      }
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      aria-label="Novo registro de medidas"
      className="flex flex-col gap-4"
    >
      <label
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
        htmlFor="data"
      >
        Data
        <Input id="data" type="date" name="data" />
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label
          className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
          htmlFor="peso"
        >
          Peso (kg)
          <Input id="peso" type="number" step="0.01" name="peso" />
        </label>
        <label
          className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
          htmlFor="cintura"
        >
          Cintura (cm)
          <Input id="cintura" type="number" step="0.01" name="cintura" />
        </label>
        <label
          className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
          htmlFor="quadril"
        >
          Quadril (cm)
          <Input id="quadril" type="number" step="0.01" name="quadril" />
        </label>
        <label
          className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
          htmlFor="braco"
        >
          Braço (cm)
          <Input id="braco" type="number" step="0.01" name="braco" />
        </label>
        <label
          className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
          htmlFor="coxa"
        >
          Coxa (cm)
          <Input id="coxa" type="number" step="0.01" name="coxa" />
        </label>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar registro"}
      </Button>
      {erro && (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}
    </form>
  );
}
