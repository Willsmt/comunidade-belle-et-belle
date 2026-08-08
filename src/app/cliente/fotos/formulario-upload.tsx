"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { enviarFoto } from "./actions";

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
    >
      <label htmlFor="arquivo">
        Foto
        <input
          id="arquivo"
          type="file"
          name="arquivo"
          accept="image/jpeg,image/png,image/webp"
          required
        />
      </label>
      <p>
        Ao enviar, você autoriza o uso desta foto na comunidade Belle et
        Belle. Ela fica privada por padrão — você escolhe se quer torná-la
        pública no seu perfil.
      </p>
      <button type="submit" disabled={isPending}>
        {isPending ? "Enviando..." : "Enviar foto"}
      </button>
      {erro && <p role="alert">{erro}</p>}
    </form>
  );
}
