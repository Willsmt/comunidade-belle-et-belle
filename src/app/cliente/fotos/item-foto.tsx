"use client";

import { alternarVisibilidadeFoto, excluirFoto } from "./actions";
import { BotaoComConfirmacao } from "@/components/botao-com-confirmacao";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImagemSensivel } from "@/components/imagem-sensivel";

function construirFormDataFoto(fotoId: string) {
  const formData = new FormData();
  formData.set("fotoId", fotoId);
  return formData;
}

function descreverPosts(total: number) {
  return total === 1 ? "1 post" : `${total} posts`;
}

function mensagemTornarPrivada(totalPosts: number) {
  const esses = totalPosts === 1 ? "esse post será apagado" : "esses posts serão apagados";
  return `Esta foto está em ${descreverPosts(totalPosts)} no feed. Ao torná-la privada, ${esses}. Deseja continuar?`;
}

function mensagemExcluir(totalPosts: number) {
  if (totalPosts === 0) {
    return "Excluir essa foto de evolução? Essa ação não pode ser desfeita.";
  }
  const apagados = totalPosts === 1 ? "que também será apagado" : "que também serão apagados";
  return `Esta foto está em ${descreverPosts(totalPosts)} no feed, ${apagados}. Deseja excluir?`;
}

export function ItemFoto({
  fotoId,
  urlAssinada,
  data,
  publica,
  totalPosts,
}: {
  fotoId: string;
  urlAssinada: string;
  data: string;
  publica: boolean;
  totalPosts: number;
}) {
  const { isPending, erro, executar } = useAcaoComErro();

  return (
    <li>
      <Card>
        <CardContent className="flex flex-col gap-2">
          <div className="relative aspect-square w-full">
            <ImagemSensivel
              src={urlAssinada}
              alt="Foto de evolução"
              fill
              sizes="(min-width: 512px) 234px, 50vw"
              className="rounded-lg object-cover"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{data}</span>
            <Badge variant={publica ? "secondary" : "outline"}>
              {publica ? "Pública" : "Privada"}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {publica && totalPosts > 0 ? (
              <BotaoComConfirmacao
                label="Tornar privada"
                mensagemConfirmacao={mensagemTornarPrivada(totalPosts)}
                action={() => alternarVisibilidadeFoto(construirFormDataFoto(fotoId))}
              />
            ) : (
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
            )}
            <BotaoComConfirmacao
              label="Excluir"
              mensagemConfirmacao={mensagemExcluir(totalPosts)}
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
