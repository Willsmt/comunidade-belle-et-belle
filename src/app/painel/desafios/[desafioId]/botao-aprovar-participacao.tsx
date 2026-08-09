"use client";

import { aprovarParticipacao } from "./actions";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";

export function BotaoAprovarParticipacao({ participacaoId }: { participacaoId: string }) {
  const { isPending, erro, executar } = useAcaoComErro();

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() => executar(() => aprovarParticipacao(participacaoId))}
      >
        {isPending ? "Aprovando..." : "Aprovar"}
      </button>
      {erro && <p role="alert">{erro}</p>}
    </div>
  );
}
