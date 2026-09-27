"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { criarRegistroMedida } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function CampoMedida({ id, label }: { id: string; label: string }) {
  return (
    <label
      className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
      htmlFor={id}
    >
      {label}
      <Input id={id} type="number" step="0.01" name={id} />
    </label>
  );
}

const MEDIDAS_TRONCO = [
  { id: "ombro", label: "Ombro (cm)" },
  { id: "peitoBusto", label: "Peito/busto (cm)" },
  { id: "cintura", label: "Cintura (cm)" },
  { id: "abdomen", label: "Abdômen (cm)" },
  { id: "quadril", label: "Quadril (cm)" },
];

const MEDIDAS_MEMBRO = [
  { nome: "Braço", direito: "bracoDireito", esquerdo: "bracoEsquerdo" },
  { nome: "Antebraço", direito: "antebracoDireito", esquerdo: "antebracoEsquerdo" },
  { nome: "Punho", direito: "punhoDireito", esquerdo: "punhoEsquerdo" },
  { nome: "Coxa", direito: "coxaDireita", esquerdo: "coxaEsquerda" },
  { nome: "Joelho", direito: "joelhoDireito", esquerdo: "joelhoEsquerdo" },
  { nome: "Panturrilha", direito: "panturrilhaDireita", esquerdo: "panturrilhaEsquerda" },
  { nome: "Tornozelo", direito: "tornozeloDireito", esquerdo: "tornozeloEsquerdo" },
];

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
        <CampoMedida id="peso" label="Peso (kg)" />
        <CampoMedida id="altura" label="Altura (cm)" />
      </div>

      <h3 className="text-sm font-semibold text-foreground">Tronco</h3>
      <div className="grid grid-cols-2 gap-4">
        {MEDIDAS_TRONCO.map((medida) => (
          <CampoMedida key={medida.id} id={medida.id} label={medida.label} />
        ))}
      </div>

      <h3 className="text-sm font-semibold text-foreground">Membros</h3>
      <div className="flex flex-col gap-4">
        {MEDIDAS_MEMBRO.map((medida) => (
          <div key={medida.direito} className="grid grid-cols-2 gap-4">
            <CampoMedida id={medida.direito} label={`${medida.nome} D (cm)`} />
            <CampoMedida id={medida.esquerdo} label={`${medida.nome} E (cm)`} />
          </div>
        ))}
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
