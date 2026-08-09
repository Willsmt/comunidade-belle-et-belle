"use client";

import { reabrirDesafio } from "./actions";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";

export function BotaoReabrirDesafio({ desafioId }: { desafioId: string }) {
  const { isPending, erro, executar } = useAcaoComErro();

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() => executar(() => reabrirDesafio(desafioId))}
      >
        {isPending ? "Reabrindo..." : "Reabrir"}
      </button>
      {erro && <p role="alert">{erro}</p>}
    </div>
  );
}
