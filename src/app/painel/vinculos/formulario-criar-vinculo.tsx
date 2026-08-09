"use client";

import { criarVinculo } from "./actions";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";

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
    <form onSubmit={handleSubmit} aria-label="Criar vínculo">
      <label htmlFor="clienteId">
        Cliente
        <select id="clienteId" name="clienteId" defaultValue="">
          <option value="">Selecione</option>
          {clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.name ?? cliente.email}
            </option>
          ))}
        </select>
      </label>

      <label htmlFor="parceriaId">
        Parceria
        <select id="parceriaId" name="parceriaId" defaultValue="">
          <option value="">Selecione</option>
          {parcerias.map((parceria) => (
            <option key={parceria.id} value={parceria.id}>
              {parceria.name ?? parceria.email}
            </option>
          ))}
        </select>
      </label>

      {erro && <p role="alert">{erro}</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? "Vinculando..." : "Vincular"}
      </button>
    </form>
  );
}
