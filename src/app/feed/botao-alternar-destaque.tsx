"use client";

import { alternarDestaque } from "./actions";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";
import { Button } from "@/components/ui/button";

export function BotaoAlternarDestaque({
  postId,
  destaque,
}: {
  postId: string;
  destaque: boolean;
}) {
  const { isPending, erro, executar } = useAcaoComErro();

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => executar(() => alternarDestaque(postId))}
      >
        {isPending
          ? "Salvando..."
          : destaque
            ? "Remover destaque"
            : "Marcar como destaque"}
      </Button>
      {erro && (
        <p role="alert" className="text-xs text-destructive">
          {erro}
        </p>
      )}
    </div>
  );
}
