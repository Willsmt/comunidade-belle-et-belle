"use client";

import { CheckCircle2 } from "lucide-react";
import { alternarMarcacao } from "./actions";
import { Button } from "@/components/ui/button";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";

export function BotaoMarcarItem({
  itemId,
  marcado,
}: {
  itemId: string;
  marcado: boolean;
}) {
  const { isPending, erro, executar } = useAcaoComErro();

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        size="sm"
        variant={marcado ? "default" : "outline"}
        disabled={isPending}
        onClick={() => executar(() => alternarMarcacao(itemId))}
      >
        <CheckCircle2 className={marcado ? "fill-primary-foreground" : ""} />
        {marcado ? "Marcado" : "Marcar"}
      </Button>
      {erro && <p role="alert">{erro}</p>}
    </div>
  );
}
