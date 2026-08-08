"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { aceitarTermo } from "./actions";

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
    <main>
      <h1>Bem-vinda à comunidade!</h1>
      <p>Que bom ter você aqui. Antes de continuar, dá uma lida no termo abaixo.</p>
      <section aria-label="Termo de consentimento">
        <p>[Texto do termo — rascunho, versão v1-rascunho]</p>
      </section>
      <button type="button" onClick={handleAceitar} disabled={isPending}>
        {isPending ? "Registrando..." : "Aceito, continuar"}
      </button>
      {erro && <p role="alert">{erro}</p>}
    </main>
  );
}
