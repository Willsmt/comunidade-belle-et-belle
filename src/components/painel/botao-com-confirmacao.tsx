"use client";

import { useTransition } from "react";

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

  function handleClick() {
    if (!window.confirm(mensagemConfirmacao)) {
      return;
    }
    startTransition(() => {
      action();
    });
  }

  return (
    <button type="button" onClick={handleClick} disabled={isPending}>
      {isPending ? "..." : label}
    </button>
  );
}
