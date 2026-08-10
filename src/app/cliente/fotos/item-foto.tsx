"use client";

import { alternarVisibilidadeFoto, excluirFoto } from "./actions";
import { BotaoComConfirmacao } from "@/components/botao-com-confirmacao";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function construirFormDataFoto(fotoId: string) {
  const formData = new FormData();
  formData.set("fotoId", fotoId);
  return formData;
}

export function ItemFoto({
  fotoId,
  urlAssinada,
  data,
  publica,
}: {
  fotoId: string;
  urlAssinada: string;
  data: string;
  publica: boolean;
}) {
  const { isPending, erro, executar } = useAcaoComErro();

  return (
    <li>
      <Card>
        <CardContent className="flex flex-col gap-2">
          <img
            src={urlAssinada}
            alt="Foto de evolução"
            className="aspect-square w-full rounded-lg object-cover"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{data}</span>
            <Badge variant={publica ? "secondary" : "outline"}>
              {publica ? "Pública" : "Privada"}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() =>
                executar(() => alternarVisibilidadeFoto(construirFormDataFoto(fotoId)))
              }
            >
              {publica ? "Tornar privada" : "Tornar pública"}
            </Button>
            <BotaoComConfirmacao
              label="Excluir"
              mensagemConfirmacao="Excluir essa foto de evolução? Essa ação não pode ser desfeita."
              action={() => excluirFoto(construirFormDataFoto(fotoId))}
            />
          </div>
          {erro && (
            <p role="alert" className="text-xs text-destructive">
              {erro}
            </p>
          )}
        </CardContent>
      </Card>
    </li>
  );
}
