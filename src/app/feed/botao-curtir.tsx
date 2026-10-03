"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { alternarCurtida } from "./actions";
import { Button } from "@/components/ui/button";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";

type EstadoCurtida = { curtiu: boolean; total: number };

function construirFormDataPostId(postId: string) {
  const formData = new FormData();
  formData.set("postId", postId);
  return formData;
}

function alternarLocalmente({ curtiu, total }: EstadoCurtida): EstadoCurtida {
  return { curtiu: !curtiu, total: curtiu ? total - 1 : total + 1 };
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
  const [estado, setEstado] = useState<EstadoCurtida>({
    curtiu: curtidoPeloUsuario,
    total: totalCurtidas,
  });
  const [propsAnteriores, setPropsAnteriores] = useState({
    curtidoPeloUsuario,
    totalCurtidas,
  });

  // Se o feed re-renderizar por outro motivo (comentário, post apagado),
  // as props trazem o valor do servidor e substituem o estado local.
  if (
    propsAnteriores.curtidoPeloUsuario !== curtidoPeloUsuario ||
    propsAnteriores.totalCurtidas !== totalCurtidas
  ) {
    setPropsAnteriores({ curtidoPeloUsuario, totalCurtidas });
    setEstado({ curtiu: curtidoPeloUsuario, total: totalCurtidas });
  }

  function alternar() {
    const anterior = estado;
    setEstado(alternarLocalmente(anterior));

    executar(async () => {
      try {
        setEstado(await alternarCurtida(construirFormDataPostId(postId)));
      } catch (error) {
        setEstado(anterior);
        throw error;
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={isPending}
        className={
          estado.curtiu ? "text-primary hover:text-primary" : "text-muted-foreground"
        }
        onClick={alternar}
      >
        <Heart className={estado.curtiu ? "fill-primary" : ""} />
        {estado.curtiu ? "Descurtir" : "Curtir"} ({estado.total})
      </Button>
      {erro && <p role="alert">{erro}</p>}
    </div>
  );
}
