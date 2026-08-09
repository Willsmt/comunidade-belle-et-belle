"use client";

import { aprovarConta } from "./actions";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";

export function BotaoAprovarConta({ userId }: { userId: string }) {
  const { isPending, erro, executar } = useAcaoComErro();

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() => executar(() => aprovarConta(userId))}
      >
        {isPending ? "Aprovando..." : "Aprovar"}
      </button>
      {erro && <p role="alert">{erro}</p>}
    </div>
  );
}
