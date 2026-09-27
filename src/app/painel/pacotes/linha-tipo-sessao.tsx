"use client";

import { useState } from "react";
import { excluirTipoSessao, reativarTipoSessao } from "./actions";
import { FormularioEditarTipoSessao } from "./formulario-editar-tipo-sessao";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";
import { BotaoComConfirmacao } from "@/components/botao-com-confirmacao";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function LinhaTipoSessao({
  tipoSessao,
}: {
  tipoSessao: { id: string; nome: string; ativo: boolean };
}) {
  const [editando, setEditando] = useState(false);
  const { isPending, erro, executar } = useAcaoComErro();

  if (editando) {
    return (
      <FormularioEditarTipoSessao
        id={tipoSessao.id}
        nome={tipoSessao.nome}
        onCancelar={() => setEditando(false)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-input px-3 py-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-foreground">{tipoSessao.nome}</span>
        {!tipoSessao.ativo && <Badge variant="outline">Arquivado</Badge>}
        <Button
          type="button"
          variant="ghost"
          size="xs"
          aria-label={`Editar tipo de sessão ${tipoSessao.nome}`}
          onClick={() => setEditando(true)}
        >
          Editar
        </Button>
        {tipoSessao.ativo ? (
          <BotaoComConfirmacao
            label="Excluir tipo de sessão"
            mensagemConfirmacao={`Excluir o tipo de sessão "${tipoSessao.nome}"? Se ele já tiver sido usado em algum pacote ou ciclo, só será arquivado — o histórico não é afetado.`}
            action={() => excluirTipoSessao(tipoSessao.id)}
          />
        ) : (
          <Button
            type="button"
            variant="outline"
            size="xs"
            disabled={isPending}
            onClick={() => executar(() => reativarTipoSessao(tipoSessao.id))}
          >
            {isPending ? "Reativando..." : "Reativar tipo de sessão"}
          </Button>
        )}
      </div>
      {erro && (
        <p role="alert" className="text-xs text-destructive">
          {erro}
        </p>
      )}
    </div>
  );
}
