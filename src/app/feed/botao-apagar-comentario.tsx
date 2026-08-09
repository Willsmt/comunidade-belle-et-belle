"use client";

import { Trash2 } from "lucide-react";
import { apagarComentario } from "./actions";
import { Button } from "@/components/ui/button";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";

function construirFormDataComentarioId(comentarioId: string) {
  const formData = new FormData();
  formData.set("comentarioId", comentarioId);
  return formData;
}

export function BotaoApagarComentario({ comentarioId }: { comentarioId: string }) {
  const { isPending, erro, executar } = useAcaoComErro();

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        disabled={isPending}
        onClick={() => {
          if (window.confirm("Apagar esse comentário? Essa ação não pode ser desfeita.")) {
            executar(() => apagarComentario(construirFormDataComentarioId(comentarioId)));
          }
        }}
      >
        <Trash2 />
        <span className="sr-only">Apagar</span>
      </Button>
      {erro && <p role="alert">{erro}</p>}
    </div>
  );
}
