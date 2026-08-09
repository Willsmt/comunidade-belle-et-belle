"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { enviarPlano } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Cliente = { id: string; name: string | null; email: string };

export function FormularioEnvio({ clientes }: { clientes: Cliente[] }) {
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
        await enviarPlano(formData);
        formRef.current?.reset();
        router.refresh();
      } catch {
        setErro(
          "Não foi possível enviar o plano. Confira os campos e o arquivo (PDF, até 10MB).",
        );
      }
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      aria-label="Enviar plano"
      noValidate
      className="flex flex-col gap-4"
    >
      <label
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
        htmlFor="clienteId"
      >
        Cliente
        <select
          id="clienteId"
          name="clienteId"
          defaultValue=""
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Selecione</option>
          {clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.name ?? cliente.email}
            </option>
          ))}
        </select>
      </label>

      <label
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
        htmlFor="tipo"
      >
        Tipo
        <select
          id="tipo"
          name="tipo"
          defaultValue=""
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Selecione</option>
          <option value="TREINO">Treino</option>
          <option value="DIETA">Dieta</option>
        </select>
      </label>

      <label
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
        htmlFor="titulo"
      >
        Título (opcional)
        <Input id="titulo" type="text" name="titulo" />
      </label>

      <label
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
        htmlFor="arquivo"
      >
        Arquivo (PDF)
        <input
          id="arquivo"
          type="file"
          name="arquivo"
          accept="application/pdf"
          className="text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground"
        />
      </label>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Enviando..." : "Enviar plano"}
      </Button>

      {erro && (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}
    </form>
  );
}
