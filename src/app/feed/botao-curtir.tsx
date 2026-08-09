"use client";

import { Heart } from "lucide-react";
import { alternarCurtida } from "./actions";
import { Button } from "@/components/ui/button";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";

function construirFormDataPostId(postId: string) {
  const formData = new FormData();
  formData.set("postId", postId);
  return formData;
}

export function BotaoCurtir({
  postId,
  curtidoPeloUsuario,
  totalCurtidas,
}: {
  postId: string;
  curtidoPeloUsuario: boolean;
  totalCurtidas: number;
}) {
  const { isPending, erro, executar } = useAcaoComErro();

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={isPending}
        className={
          curtidoPeloUsuario
            ? "text-primary hover:text-primary"
            : "text-muted-foreground"
        }
        onClick={() => executar(() => alternarCurtida(construirFormDataPostId(postId)))}
      >
        <Heart className={curtidoPeloUsuario ? "fill-primary" : ""} />
        {curtidoPeloUsuario ? "Descurtir" : "Curtir"} ({totalCurtidas})
      </Button>
      {erro && <p role="alert">{erro}</p>}
    </div>
  );
}
