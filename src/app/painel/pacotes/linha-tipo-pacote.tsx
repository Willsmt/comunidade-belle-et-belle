"use client";

import { useState } from "react";
import { excluirTipoPacote, reativarTipoPacote } from "./actions";
import { FormularioEditarTipoPacote } from "./formulario-editar-tipo-pacote";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";
import { BotaoComConfirmacao } from "@/components/botao-com-confirmacao";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type OpcaoTipoSessao = { id: string; nome: string; ativo: boolean };

export function LinhaTipoPacote({
  tipoPacote,
  opcoesTipoSessao,
}: {
  tipoPacote: {
    id: string;
    nome: string;
    ativo: boolean;
    itens: { id: string; tipoSessaoId: string; quantidade: number; tipoSessao: { nome: string } }[];
  };
  opcoesTipoSessao: OpcaoTipoSessao[];
}) {
  const [editando, setEditando] = useState(false);
  const { isPending, erro, executar } = useAcaoComErro();

  if (editando) {
    // Garante que tipos de sessão já usados neste pacote continuam editáveis
    // mesmo que tenham sido arquivados depois — senão salvar removeria em silêncio.
    const opcoes = [
      ...opcoesTipoSessao,
      ...tipoPacote.itens
        .filter((item) => !opcoesTipoSessao.some((opcao) => opcao.id === item.tipoSessaoId))
        .map((item) => ({ id: item.tipoSessaoId, nome: item.tipoSessao.nome, ativo: false })),
    ];

    return (
      <Card>
        <CardContent>
          <FormularioEditarTipoPacote
            id={tipoPacote.id}
            nome={tipoPacote.nome}
            itensAtuais={tipoPacote.itens}
            opcoesTipoSessao={opcoes}
            onCancelar={() => setEditando(false)}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-heading text-base text-foreground">{tipoPacote.nome}</span>
          {!tipoPacote.ativo && <Badge variant="outline">Arquivado</Badge>}
        </div>
        <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
          {tipoPacote.itens.map((item) => (
            <li key={item.id}>
              {item.tipoSessao.nome}: {item.quantidade}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label={`Editar tipo de pacote ${tipoPacote.nome}`}
            onClick={() => setEditando(true)}
          >
            Editar
          </Button>
          {tipoPacote.ativo ? (
            <BotaoComConfirmacao
              label="Excluir tipo de pacote"
              mensagemConfirmacao={`Excluir o tipo de pacote "${tipoPacote.nome}"? Se já tiver sido vinculado a alguma cliente, ele só será arquivado — o histórico dela não é afetado.`}
              action={() => excluirTipoPacote(tipoPacote.id)}
            />
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => executar(() => reativarTipoPacote(tipoPacote.id))}
            >
              {isPending ? "Reativando..." : "Reativar tipo de pacote"}
            </Button>
          )}
        </div>
        {erro && (
          <p role="alert" className="text-xs text-destructive">
            {erro}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
