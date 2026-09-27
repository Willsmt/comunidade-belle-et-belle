"use client";

import { marcarSessaoRealizada } from "./actions";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";
import { Button } from "@/components/ui/button";

export function BotaoMarcarSessao({
  cicloPacoteId,
  tipoSessaoId,
  limiteAtingido,
}: {
  cicloPacoteId: string;
  tipoSessaoId: string;
  limiteAtingido: boolean;
}) {
  const { isPending, erro, executar } = useAcaoComErro();

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending || limiteAtingido}
        onClick={() => executar(() => marcarSessaoRealizada(cicloPacoteId, tipoSessaoId))}
      >
        {isPending ? "Marcando..." : limiteAtingido ? "Limite atingido" : "Marcar sessão"}
      </Button>
      {erro && (
        <p role="alert" className="text-xs text-destructive">
          {erro}
        </p>
      )}
    </div>
  );
}
