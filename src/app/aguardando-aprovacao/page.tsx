"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { sair } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const INTERVALO_VERIFICACAO_SEGUNDOS = 12;

export default function AguardandoAprovacaoPage() {
  const { data: session, update } = useSession({
    required: true,
  });
  const router = useRouter();

  useEffect(() => {
    const intervalo = setInterval(() => {
      update();
    }, INTERVALO_VERIFICACAO_SEGUNDOS * 1000);

    return () => clearInterval(intervalo);
  }, [update]);

  useEffect(() => {
    if (session?.user.status && session.user.status !== "PENDENTE") {
      router.refresh();
    }
  }, [session?.user.status, router]);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 py-10">
      <span className="font-heading text-2xl text-foreground">Belle et Belle</span>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <h1 className="font-heading text-xl text-foreground">Quase lá!</h1>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Sua entrada na comunidade está aguardando aprovação da Patrícia.
            Assim que ela liberar, você já cai direto por aqui — não precisa
            fazer nada.
          </p>
          <Button type="button" variant="outline" onClick={() => update()} className="w-full">
            Verificar novamente
          </Button>
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
