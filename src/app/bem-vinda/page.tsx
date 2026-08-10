"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { aceitarTermo } from "./actions";
import { sair } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function BemVindaPage() {
  const { update } = useSession();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function handleAceitar() {
    setErro(null);
    startTransition(async () => {
      try {
        await aceitarTermo();
        await update();
        router.refresh();
      } catch {
        setErro(
          "Não foi possível registrar seu aceite. Tenta de novo em alguns segundos.",
        );
      }
    });
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 py-10">
      <span className="font-heading text-2xl text-foreground">Belle et Belle</span>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <h1 className="font-heading text-xl text-foreground">Bem-vinda à comunidade!</h1>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Que bom ter você aqui. Antes de continuar, dá uma lida no termo abaixo.
          </p>
          <section
            aria-label="Termo de consentimento"
            className="max-h-40 overflow-y-auto rounded-lg border border-border bg-muted p-3 text-xs text-muted-foreground"
          >
            <p>[Texto do termo — rascunho, versão v1-rascunho]</p>
          </section>
          <Button type="button" onClick={handleAceitar} disabled={isPending} className="w-full">
            {isPending ? "Registrando..." : "Aceito, continuar"}
          </Button>
          {erro && (
            <p role="alert" className="text-sm text-destructive">
              {erro}
            </p>
          )}
          <form action={sair}>
            <button
              type="submit"
              className="w-full text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
            >
              Sair
            </button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
