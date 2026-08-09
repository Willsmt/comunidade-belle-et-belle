"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

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
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={isPending}
      >
        {isPending ? "..." : label}
      </Button>
      {erro && (
        <p role="alert" className="text-xs text-destructive">
          {erro}
        </p>
      )}
    </div>
  );
}
