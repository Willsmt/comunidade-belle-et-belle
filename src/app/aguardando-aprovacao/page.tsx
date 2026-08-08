"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
    <main>
      <h1>Quase lá!</h1>
      <p>
        Sua entrada na comunidade está aguardando aprovação da Patrícia.
        Assim que ela liberar, você já cai direto por aqui — não precisa
        fazer nada.
      </p>
      <button type="button" onClick={() => update()}>
        Verificar novamente
      </button>
    </main>
  );
}
