"use client";

import { alternarExigeFoto } from "./actions";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";
import { Button } from "@/components/ui/button";

export function BotaoAlternarExigeFoto({
  itemId,
  exigeFoto,
}: {
  itemId: string;
  exigeFoto: boolean;
}) {
  const { isPending, erro, executar } = useAcaoComErro();

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => executar(() => alternarExigeFoto(itemId))}
      >
        {isPending ? "Salvando..." : exigeFoto ? "Não exigir foto" : "Exigir foto"}
      </Button>
      {erro && (
        <p role="alert" className="text-xs text-destructive">
          {erro}
        </p>
      )}
    </div>
  );
}
