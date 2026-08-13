"use client";

import { useState } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AvatarPessoa } from "@/components/avatar-pessoa";
import { cn } from "@/lib/utils";

type LinhaRanking = {
  clienteId: string;
  nome: string;
  pontos: number;
  fotoUrl: string | null;
};

export function RankingToggle({
  rankingSemanal,
  rankingGeral,
  clienteId,
}: {
  rankingSemanal: LinhaRanking[];
  rankingGeral: LinhaRanking[];
  clienteId: string;
}) {
  const [aba, setAba] = useState<"semana" | "geral">("semana");
  const ranking = aba === "semana" ? rankingSemanal : rankingGeral;

  return (
    <Card className="mt-4">
      <CardContent className="flex flex-col gap-3">
        <div role="tablist" aria-label="Ranking" className="flex gap-2">
          <Button
            type="button"
            variant={aba === "semana" ? "default" : "outline"}
            size="sm"
            aria-pressed={aba === "semana"}
            onClick={() => setAba("semana")}
            className="flex-1"
          >
            <Trophy className="size-3.5" />
            Ranking da semana
          </Button>
          <Button
            type="button"
            variant={aba === "geral" ? "default" : "outline"}
            size="sm"
            aria-pressed={aba === "geral"}
            onClick={() => setAba("geral")}
            className="flex-1"
          >
            <Trophy className="size-3.5" />
            Ranking geral
          </Button>
        </div>

        {ranking.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ninguém pontuou ainda.</p>
        ) : (
          <ol className="flex flex-col gap-1.5">
            {ranking.map((linha, indice) => {
              const voce = linha.clienteId === clienteId;
              return (
                <li
                  key={linha.clienteId}
                  aria-current={voce ? "true" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm",
                    voce ? "bg-secondary text-secondary-foreground" : "text-foreground",
                  )}
                >
                  <span className="w-5 font-heading text-xs text-muted-foreground">
                    {indice + 1}º
                  </span>
                  <AvatarPessoa nome={linha.nome} fotoUrl={linha.fotoUrl} />
                  <span className="flex-1 font-medium">
                    {voce ? (
                      "Você"
                    ) : (
                      <Link href={`/perfil/${linha.clienteId}`} className="hover:underline">
                        {linha.nome}
                      </Link>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">{linha.pontos} pts</span>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
