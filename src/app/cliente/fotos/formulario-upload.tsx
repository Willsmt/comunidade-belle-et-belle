"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { enviarFoto } from "./actions";
import { Button } from "@/components/ui/button";

export function FormularioUpload() {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        await enviarFoto(formData);
        formRef.current?.reset();
        router.refresh();
      } catch {
        setErro(
          "Não foi possível enviar a foto. Confira o formato (JPEG, PNG ou WebP) e o tamanho (até 5MB).",
        );
      }
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      aria-label="Enviar foto de evolução"
      noValidate
      className="flex flex-col gap-3"
    >
      <label
        className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
        htmlFor="arquivo"
      >
        Foto
        <input
          id="arquivo"
          type="file"
          name="arquivo"
          accept="image/jpeg,image/png,image/webp"
          required
          className="text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground"
        />
      </label>
      <p className="text-xs text-muted-foreground">
        Ao enviar, você autoriza o uso desta foto na comunidade Belle et
        Belle. Ela fica privada por padrão — você escolhe se quer torná-la
        pública no seu perfil.
      </p>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Enviando..." : "Enviar foto"}
      </Button>
      {erro && (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}
    </form>
  );
}
