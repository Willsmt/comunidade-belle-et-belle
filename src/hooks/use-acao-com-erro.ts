"use client";

import { useState, useTransition } from "react";

export function useAcaoComErro() {
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function executar(acao: () => Promise<void>) {
    setErro(null);
    startTransition(async () => {
      try {
        await acao();
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível concluir a ação.",
        );
      }
    });
  }

  return { isPending, erro, executar };
}
