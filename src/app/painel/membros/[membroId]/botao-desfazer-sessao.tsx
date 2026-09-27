"use client";

import { desfazerSessaoRealizada } from "./actions";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";
import { Button } from "@/components/ui/button";

export function BotaoDesfazerSessao({
  sessaoRealizadaId,
}: {
  sessaoRealizadaId: string;
}) {
  const { isPending, erro, executar } = useAcaoComErro();

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={isPending}
        onClick={() => executar(() => desfazerSessaoRealizada(sessaoRealizadaId))}
      >
        {isPending ? "Desfazendo..." : "Desfazer"}
      </Button>
      {erro && (
        <p role="alert" className="text-xs text-destructive">
          {erro}
        </p>
      )}
    </div>
  );
}
