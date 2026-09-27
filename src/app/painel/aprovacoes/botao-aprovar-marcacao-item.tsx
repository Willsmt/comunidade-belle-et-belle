"use client";

import { aprovarMarcacaoItem } from "./actions";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";
import { Button } from "@/components/ui/button";

export function BotaoAprovarMarcacaoItem({ marcacaoId }: { marcacaoId: string }) {
  const { isPending, erro, executar } = useAcaoComErro();

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        size="sm"
        disabled={isPending}
        onClick={() => executar(() => aprovarMarcacaoItem(marcacaoId))}
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
