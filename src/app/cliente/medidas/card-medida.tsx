"use client";

import { useState } from "react";
import { excluirRegistroMedida } from "./actions";
import { FormularioRegistro } from "./formulario-registro";
import { BotaoComConfirmacao } from "@/components/botao-com-confirmacao";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const MEDIDAS_TRONCO = [
  { chave: "ombro", rotulo: "Ombro" },
  { chave: "peitoBusto", rotulo: "Peito/busto" },
  { chave: "cintura", rotulo: "Cintura" },
  { chave: "abdomen", rotulo: "Abdômen" },
  { chave: "quadril", rotulo: "Quadril" },
];

const MEDIDAS_MEMBRO = [
  { rotulo: "Braço", direito: "bracoDireito", esquerdo: "bracoEsquerdo" },
  { rotulo: "Antebraço", direito: "antebracoDireito", esquerdo: "antebracoEsquerdo" },
  { rotulo: "Punho", direito: "punhoDireito", esquerdo: "punhoEsquerdo" },
  { rotulo: "Coxa", direito: "coxaDireita", esquerdo: "coxaEsquerda" },
  { rotulo: "Joelho", direito: "joelhoDireito", esquerdo: "joelhoEsquerdo" },
  { rotulo: "Panturrilha", direito: "panturrilhaDireita", esquerdo: "panturrilhaEsquerda" },
  { rotulo: "Tornozelo", direito: "tornozeloDireito", esquerdo: "tornozeloEsquerdo" },
];

function exibir(valor: string | undefined): string {
  return valor ? valor : "—";
}

export function CardMedida({
  id,
  dataFormatada,
  valores,
}: {
  id: string;
  dataFormatada: string;
  valores: Record<string, string>;
}) {
  const [editando, setEditando] = useState(false);

  if (editando) {
    return (
      <Card>
        <CardContent>
          <FormularioRegistro
            registroId={id}
            valoresIniciais={valores}
            aoConcluir={() => setEditando(false)}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-foreground">{dataFormatada}</span>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-3">
          <span>Peso: {exibir(valores.peso)} kg</span>
          <span>Altura: {exibir(valores.altura)} cm</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-3">
          {MEDIDAS_TRONCO.map((item) => (
            <span key={item.chave}>
              {item.rotulo}: {exibir(valores[item.chave])} cm
            </span>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-3">
          {MEDIDAS_MEMBRO.map((item) => (
            <span key={item.direito}>
              {item.rotulo} D/E: {exibir(valores[item.direito])} /{" "}
              {exibir(valores[item.esquerdo])} cm
            </span>
          ))}
          {(valores.braco || valores.coxa) && (
            <span>
              Braço/coxa (registro anterior): {exibir(valores.braco)} /{" "}
              {exibir(valores.coxa)} cm
            </span>
          )}
        </div>
        <div className="mt-1 flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEditando(true)}
          >
            Editar
          </Button>
          <BotaoComConfirmacao
            label="Excluir"
            mensagemConfirmacao="Excluir este registro de medidas? Essa ação não pode ser desfeita."
            action={() => excluirRegistroMedida(id)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
