"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { criarRegistroMedida, editarRegistroMedida } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function CampoMedida({
  id,
  label,
  min,
  max,
  defaultValue,
}: {
  id: string;
  label: string;
  min: number;
  max: number;
  defaultValue?: string;
}) {
  return (
    <label
      className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
      htmlFor={id}
    >
      {label}
      <Input
        id={id}
        type="number"
        step="0.01"
        name={id}
        min={min}
        max={max}
        defaultValue={defaultValue}
        onWheel={(event) => event.currentTarget.blur()}
      />
    </label>
  );
}

// Faixas generosas de bom senso — limite de segurança contra erro de
// digitação, não precisão clínica. Espelham FAIXAS em actions.ts.
const FAIXA_PESO = { min: 20, max: 300 };
const FAIXA_ALTURA = { min: 100, max: 250 };
const FAIXA_TRONCO = { min: 40, max: 200 };
const FAIXA_MEMBRO = { min: 8, max: 100 };

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

export function FormularioRegistro({
  registroId,
  valoresIniciais,
  aoConcluir,
}: {
  registroId?: string;
  valoresIniciais?: Record<string, string>;
  aoConcluir?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const emEdicao = registroId !== undefined;

  function valorInicial(campo: string): string | undefined {
    return valoresIniciais?.[campo] || undefined;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        if (registroId) {
          await editarRegistroMedida(registroId, formData);
        } else {
          await criarRegistroMedida(formData);
        }
        formRef.current?.reset();
        router.refresh();
        aoConcluir?.();
      } catch (erro) {
        setErro(
          erro instanceof Error
            ? erro.message
            : "Não foi possível salvar o registro.",
        );
      }
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      aria-label={emEdicao ? "Editar registro de medidas" : "Novo registro de medidas"}
      className="flex flex-col gap-4"
    >
      <label
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
        htmlFor="data"
      >
        Data
        <Input
          id="data"
          type="date"
          name="data"
          defaultValue={valorInicial("data")}
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <CampoMedida
          id="peso"
          label="Peso (kg)"
          defaultValue={valorInicial("peso")}
          {...FAIXA_PESO}
        />
        <CampoMedida
          id="altura"
          label="Altura (cm)"
          defaultValue={valorInicial("altura")}
          {...FAIXA_ALTURA}
        />
      </div>

      <h3 className="text-sm font-semibold text-foreground">Tronco</h3>
      <div className="grid grid-cols-2 gap-4">
        {MEDIDAS_TRONCO.map((medida) => (
          <CampoMedida
            key={medida.id}
            id={medida.id}
            label={medida.label}
            defaultValue={valorInicial(medida.id)}
            {...FAIXA_TRONCO}
          />
        ))}
      </div>

      <h3 className="text-sm font-semibold text-foreground">Membros</h3>
      <div className="flex flex-col gap-4">
        {MEDIDAS_MEMBRO.map((medida) => (
          <div key={medida.direito} className="grid grid-cols-2 gap-4">
            <CampoMedida
              id={medida.direito}
              label={`${medida.nome} D (cm)`}
              defaultValue={valorInicial(medida.direito)}
              {...FAIXA_MEMBRO}
            />
            <CampoMedida
              id={medida.esquerdo}
              label={`${medida.nome} E (cm)`}
              defaultValue={valorInicial(medida.esquerdo)}
              {...FAIXA_MEMBRO}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Salvando..."
            : emEdicao
              ? "Salvar alterações"
              : "Salvar registro"}
        </Button>
        {emEdicao && (
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => aoConcluir?.()}
          >
            Cancelar
          </Button>
        )}
      </div>
      {erro && (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}
    </form>
  );
}
