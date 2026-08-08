"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { criarRegistroMedida } from "./actions";

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
    >
      <label htmlFor="data">
        Data
        <input id="data" type="date" name="data" />
      </label>
      <label htmlFor="peso">
        Peso (kg)
        <input id="peso" type="number" step="0.01" name="peso" />
      </label>
      <label htmlFor="cintura">
        Cintura (cm)
        <input id="cintura" type="number" step="0.01" name="cintura" />
      </label>
      <label htmlFor="quadril">
        Quadril (cm)
        <input id="quadril" type="number" step="0.01" name="quadril" />
      </label>
      <label htmlFor="braco">
        Braço (cm)
        <input id="braco" type="number" step="0.01" name="braco" />
      </label>
      <label htmlFor="coxa">
        Coxa (cm)
        <input id="coxa" type="number" step="0.01" name="coxa" />
      </label>
      <button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar registro"}
      </button>
      {erro && <p role="alert">{erro}</p>}
    </form>
  );
}
