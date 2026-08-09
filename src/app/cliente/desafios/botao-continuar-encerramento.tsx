"use client";

import { marcarAvisoEncerramentoVisto } from "./actions";
import { Button } from "@/components/ui/button";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";

export function BotaoContinuarEncerramento() {
  const { isPending, erro, executar } = useAcaoComErro();

  return (
    <div className="flex flex-col items-center gap-1">
      <Button
        type="button"
        size="sm"
        disabled={isPending}
        onClick={() => executar(() => marcarAvisoEncerramentoVisto())}
      >
        Continuar
      </Button>
      {erro && <p role="alert">{erro}</p>}
    </div>
  );
}
