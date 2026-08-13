"use client";

import { criarRegraLimiar } from "./actions";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FormularioCriarRegraLimiar({
  desafioId,
  emblemas,
}: {
  desafioId: string;
  emblemas: { id: string; nome: string }[];
}) {
  const { isPending, erro, executar } = useAcaoComErro();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    executar(() => criarRegraLimiar(desafioId, formData));
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Criar regra de limiar diário"
      className="flex flex-col gap-4"
    >
      <label
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
        htmlFor="limiarItens"
      >
        Itens no dia
        <Input id="limiarItens" name="limiarItens" type="number" min="1" required />
      </label>
      <label
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
        htmlFor="pontosExtras-limiar"
      >
        Pontos extras
        <Input id="pontosExtras-limiar" name="pontosExtras" type="number" min="1" required />
      </label>
      <label
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
        htmlFor="emblemaId-limiar"
      >
        Emblema (opcional)
        <select
          id="emblemaId-limiar"
          name="emblemaId"
          defaultValue=""
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Nenhum</option>
          {emblemas.map((emblema) => (
            <option key={emblema.id} value={emblema.id}>
              {emblema.nome}
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
        {isPending ? "Criando..." : "Criar regra"}
      </Button>
    </form>
  );
}
