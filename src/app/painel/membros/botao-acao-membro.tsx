"use client";

import { useAcaoComErro } from "@/hooks/use-acao-com-erro";

export function BotaoAcaoMembro({
  label,
  labelPendente,
  action,
}: {
  label: string;
  labelPendente: string;
  action: () => Promise<void>;
}) {
  const { isPending, erro, executar } = useAcaoComErro();

  return (
    <div className="flex flex-col items-start gap-1">
      <button type="button" disabled={isPending} onClick={() => executar(action)}>
        {isPending ? labelPendente : label}
      </button>
      {erro && <p role="alert">{erro}</p>}
    </div>
  );
}
