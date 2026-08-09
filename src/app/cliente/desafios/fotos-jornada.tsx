"use client";

import { Camera } from "lucide-react";
import { enviarFotoAntes, enviarFotoDepois } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";

export function FotosJornada({
  fotoAntesUrl,
  fotoDepoisUrl,
}: {
  fotoAntesUrl: string | null;
  fotoDepoisUrl: string | null;
}) {
  const antes = useAcaoComErro();
  const depois = useAcaoComErro();

  function handleSubmitAntes(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    antes.executar(() => enviarFotoAntes(formData));
  }

  function handleSubmitDepois(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    depois.executar(() => enviarFotoDepois(formData));
  }

  return (
    <Card className="mt-4" role="region" aria-label="Minhas fotos do desafio">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Camera className="size-4 text-primary" />
          Minhas fotos do desafio
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center gap-2">
          <h3 className="text-xs font-medium text-muted-foreground">Antes</h3>
          {fotoAntesUrl ? (
            <img
              src={fotoAntesUrl}
              alt="Foto de antes"
              width={150}
              className="aspect-square w-full rounded-lg object-cover"
            />
          ) : (
            <p className="flex aspect-square w-full items-center justify-center rounded-lg bg-muted p-2 text-center text-xs text-muted-foreground">
              Nenhuma foto enviada ainda
            </p>
          )}
          <form
            onSubmit={handleSubmitAntes}
            aria-label="Enviar foto de antes"
            className="flex w-full flex-col gap-1.5"
          >
            <input
              name="foto"
              type="file"
              accept="image/*"
              required
              className="text-xs text-muted-foreground file:mr-2 file:rounded-lg file:border-0 file:bg-secondary file:px-2 file:py-1 file:text-xs file:font-medium file:text-secondary-foreground"
            />
            {antes.erro && <p role="alert">{antes.erro}</p>}
            <Button type="submit" size="sm" variant="secondary" disabled={antes.isPending}>
              {fotoAntesUrl ? "Trocar foto" : "Enviar foto"}
            </Button>
          </form>
        </div>
        <div className="flex flex-col items-center gap-2">
          <h3 className="text-xs font-medium text-muted-foreground">Depois</h3>
          {fotoDepoisUrl ? (
            <img
              src={fotoDepoisUrl}
              alt="Foto de depois"
              width={150}
              className="aspect-square w-full rounded-lg object-cover"
            />
          ) : (
            <p className="flex aspect-square w-full items-center justify-center rounded-lg bg-muted p-2 text-center text-xs text-muted-foreground">
              Nenhuma foto enviada ainda
            </p>
          )}
          <form
            onSubmit={handleSubmitDepois}
            aria-label="Enviar foto de depois"
            className="flex w-full flex-col gap-1.5"
          >
            <input
              name="foto"
              type="file"
              accept="image/*"
              required
              className="text-xs text-muted-foreground file:mr-2 file:rounded-lg file:border-0 file:bg-secondary file:px-2 file:py-1 file:text-xs file:font-medium file:text-secondary-foreground"
            />
            {depois.erro && <p role="alert">{depois.erro}</p>}
            <Button type="submit" size="sm" variant="secondary" disabled={depois.isPending}>
              {fotoDepoisUrl ? "Trocar foto" : "Enviar foto"}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
