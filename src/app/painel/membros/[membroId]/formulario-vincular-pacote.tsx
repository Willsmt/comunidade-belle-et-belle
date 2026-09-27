"use client";

import { useState } from "react";
import { vincularPacote } from "./actions";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";
import { BotaoComConfirmacao } from "@/components/botao-com-confirmacao";
import { Button } from "@/components/ui/button";

type ItemCicloAtivo = {
  tipoSessaoNome: string;
  quantidadeContratada: number;
  quantidadeRealizada: number;
};

export function FormularioVincularPacote({
  clienteId,
  tiposPacote,
  cicloAtivo,
}: {
  clienteId: string;
  tiposPacote: { id: string; nome: string }[];
  /** Quando presente, vincular passa a exigir confirmação (FR-014) — vira "Renovar pacote". */
  cicloAtivo?: { nomePacote: string; itens: ItemCicloAtivo[] } | null;
}) {
  const { isPending, erro, executar } = useAcaoComErro();
  const [tipoPacoteId, setTipoPacoteId] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tipoPacoteId || cicloAtivo) {
      return;
    }
    executar(() => vincularPacote(clienteId, tipoPacoteId));
  }

  const mensagemConfirmacao = cicloAtivo
    ? `Isso vai arquivar o ciclo ativo atual (${cicloAtivo.nomePacote}: ${cicloAtivo.itens
        .map(
          (item) =>
            `${item.tipoSessaoNome} ${item.quantidadeRealizada}/${item.quantidadeContratada}`,
        )
        .join(", ")}) e abrir um novo ciclo. Continuar?`
    : "";

  return (
    <form onSubmit={handleSubmit} aria-label="Vincular pacote" className="flex flex-col gap-4">
      <label
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
        htmlFor="tipoPacoteId"
      >
        Tipo de pacote
        <select
          id="tipoPacoteId"
          name="tipoPacoteId"
          required
          value={tipoPacoteId}
          onChange={(event) => setTipoPacoteId(event.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Selecione...</option>
          {tiposPacote.map((tipoPacote) => (
            <option key={tipoPacote.id} value={tipoPacote.id}>
              {tipoPacote.nome}
            </option>
          ))}
        </select>
      </label>
      {erro && (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}
      {cicloAtivo ? (
        <BotaoComConfirmacao
          label="Renovar pacote"
          mensagemConfirmacao={mensagemConfirmacao}
          disabled={!tipoPacoteId}
          action={() => vincularPacote(clienteId, tipoPacoteId)}
        />
      ) : (
        <Button type="submit" disabled={isPending || !tipoPacoteId}>
          {isPending ? "Vinculando..." : "Vincular pacote"}
        </Button>
      )}
    </form>
  );
}
