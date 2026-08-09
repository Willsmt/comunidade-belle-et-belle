"use client";

import { useAcaoComErro } from "@/hooks/use-acao-com-erro";
import { Button } from "@/components/ui/button";

export function BotaoAcaoMembro({
  label,
  labelPendente,
  membroId,
  acao,
}: {
  label: string;
  labelPendente: string;
  membroId: string;
  acao: (membroId: string) => Promise<void>;
}) {
  const { isPending, erro, executar } = useAcaoComErro();

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => executar(() => acao(membroId))}
      >
        {isPending ? labelPendente : label}
      </Button>
      {erro && (
        <p role="alert" className="text-xs text-destructive">
          {erro}
        </p>
      )}
    </div>
  );
}
