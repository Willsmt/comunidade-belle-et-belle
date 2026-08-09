"use client";

import { criarRegraCombo } from "./actions";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FormularioCriarRegraCombo({
  desafioId,
  itens,
}: {
  desafioId: string;
  itens: { id: string; descricao: string }[];
}) {
  const { isPending, erro, executar } = useAcaoComErro();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    executar(() => criarRegraCombo(desafioId, formData));
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Criar regra de combo"
      className="flex flex-col gap-4"
    >
      <label
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
        htmlFor="itensCombo"
      >
        Itens do combo
        <select
          id="itensCombo"
          name="itensCombo"
          multiple
          required
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {itens.map((item) => (
            <option key={item.id} value={item.id}>
              {item.descricao}
            </option>
          ))}
        </select>
      </label>
      <label
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
        htmlFor="pontosExtras-combo"
      >
        Pontos extras
        <Input id="pontosExtras-combo" name="pontosExtras" type="number" min="1" required />
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
