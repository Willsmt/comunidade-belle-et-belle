"use client";

import { reativarVinculo } from "./actions";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";

export function BotaoReativarVinculo({ vinculoId }: { vinculoId: string }) {
  const { isPending, erro, executar } = useAcaoComErro();

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() => executar(() => reativarVinculo(vinculoId))}
      >
        {isPending ? "Reativando..." : "Reativar"}
      </button>
      {erro && <p role="alert">{erro}</p>}
    </div>
  );
}
