"use client";

import { aprovarConta } from "./actions";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";
import { Button } from "@/components/ui/button";

export function BotaoAprovarConta({ userId }: { userId: string }) {
  const { isPending, erro, executar } = useAcaoComErro();

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        size="sm"
        disabled={isPending}
        onClick={() => executar(() => aprovarConta(userId))}
      >
        {isPending ? "Aprovando..." : "Aprovar"}
      </Button>
      {erro && (
        <p role="alert" className="text-xs text-destructive">
          {erro}
        </p>
      )}
    </div>
  );
}
