"use client";

import { criarVinculo } from "./actions";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";
import { Button } from "@/components/ui/button";

export function FormularioCriarVinculo({
  clientes,
  parcerias,
}: {
  clientes: { id: string; name: string | null; email: string }[];
  parcerias: { id: string; name: string | null; email: string }[];
}) {
  const { isPending, erro, executar } = useAcaoComErro();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    executar(() => criarVinculo(formData));
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Criar vínculo"
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
        htmlFor="parceriaId"
      >
        Parceria
        <select
          id="parceriaId"
          name="parceriaId"
          defaultValue=""
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Selecione</option>
          {parcerias.map((parceria) => (
            <option key={parceria.id} value={parceria.id}>
              {parceria.name ?? parceria.email}
            </option>
          ))}
        </select>
      </label>

      {erro && (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Vinculando..." : "Vincular"}
      </Button>
    </form>
  );
}
