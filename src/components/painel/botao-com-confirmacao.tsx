"use client";

import { useState, useTransition } from "react";

export function BotaoComConfirmacao({
  label,
  mensagemConfirmacao,
  action,
}: {
  label: string;
  mensagemConfirmacao: string;
  action: () => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function handleClick() {
    if (!window.confirm(mensagemConfirmacao)) {
      return;
    }
    setErro(null);
    startTransition(async () => {
      try {
        await action();
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível concluir a ação.",
        );
      }
    });
  }

  return (
    <>
      <button type="button" onClick={handleClick} disabled={isPending}>
        {isPending ? "..." : label}
      </button>
      {erro && <p role="alert">{erro}</p>}
    </>
  );
}
