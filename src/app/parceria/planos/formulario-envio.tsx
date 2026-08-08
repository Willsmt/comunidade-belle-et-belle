"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { enviarPlano } from "./actions";

type Cliente = { id: string; name: string | null; email: string };

export function FormularioEnvio({ clientes }: { clientes: Cliente[] }) {
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
        await enviarPlano(formData);
        formRef.current?.reset();
        router.refresh();
      } catch {
        setErro(
          "Não foi possível enviar o plano. Confira os campos e o arquivo (PDF, até 10MB).",
        );
      }
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      aria-label="Enviar plano"
      noValidate
    >
      <label htmlFor="clienteId">
        Cliente
        <select id="clienteId" name="clienteId" defaultValue="">
          <option value="">Selecione</option>
          {clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.name ?? cliente.email}
            </option>
          ))}
        </select>
      </label>

      <label htmlFor="tipo">
        Tipo
        <select id="tipo" name="tipo" defaultValue="">
          <option value="">Selecione</option>
          <option value="TREINO">Treino</option>
          <option value="DIETA">Dieta</option>
        </select>
      </label>

      <label htmlFor="titulo">
        Título (opcional)
        <input id="titulo" type="text" name="titulo" />
      </label>

      <label htmlFor="arquivo">
        Arquivo (PDF)
        <input id="arquivo" type="file" name="arquivo" accept="application/pdf" />
      </label>

      <button type="submit" disabled={isPending}>
        {isPending ? "Enviando..." : "Enviar plano"}
      </button>

      {erro && <p role="alert">{erro}</p>}
    </form>
  );
}
