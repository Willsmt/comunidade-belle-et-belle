"use client";

import { useEffect, useRef, useState } from "react";
import { marcarItemComFoto } from "./actions";
import { Button } from "@/components/ui/button";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";

export function FormularioMarcarItemComFoto({
  itemId,
  descricao,
}: {
  itemId: string;
  descricao: string;
}) {
  const { isPending, erro, executar } = useAcaoComErro();
  const inputRef = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleArquivoSelecionado(event: React.ChangeEvent<HTMLInputElement>) {
    const novoArquivo = event.target.files?.[0];
    if (!novoArquivo) {
      return;
    }
    setPreviewUrl((urlAnterior) => {
      if (urlAnterior) {
        URL.revokeObjectURL(urlAnterior);
      }
      return URL.createObjectURL(novoArquivo);
    });
    setArquivo(novoArquivo);
  }

  function handleTrocarFoto() {
    inputRef.current?.click();
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!arquivo) {
      return;
    }
    const formData = new FormData();
    formData.append("foto", arquivo);
    executar(() => marcarItemComFoto(itemId, formData));
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label={`Marcar ${descricao} com foto`}
      className="flex flex-col gap-2"
    >
      <label
        htmlFor={`foto-${itemId}`}
        className={
          previewUrl
            ? "sr-only"
            : "flex flex-col gap-1 text-sm font-medium text-foreground"
        }
      >
        Foto
        <input
          ref={inputRef}
          id={`foto-${itemId}`}
          name="foto"
          type="file"
          accept="image/*"
          onChange={handleArquivoSelecionado}
          className={
            previewUrl
              ? "hidden"
              : "text-xs text-muted-foreground file:mr-2 file:rounded-lg file:border-0 file:bg-secondary file:px-2 file:py-1 file:text-xs file:font-medium file:text-secondary-foreground"
          }
        />
      </label>
      {previewUrl && (
        <div className="flex items-center gap-2">
          <img
            src={previewUrl}
            alt="Prévia da foto selecionada"
            className="size-16 rounded-lg object-cover"
          />
          <Button type="button" size="sm" variant="outline" onClick={handleTrocarFoto}>
            Trocar foto
          </Button>
        </div>
      )}
      {erro && <p role="alert">{erro}</p>}
      {arquivo && (
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Enviando..." : "Confirmar"}
        </Button>
      )}
    </form>
  );
}
