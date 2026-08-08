import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import Link from "next/link";
import { auth } from "@/auth";
import { podeAcessarPainel } from "@/lib/auth/pode-acessar-painel";

export default async function PainelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session?.user || !podeAcessarPainel(session.user.papeis)) {
    redirect("/");
  }

  return (
    <div>
      <nav aria-label="Painel de gerenciamento">
        <Link href="/painel/aprovacoes">Aprovações</Link>
        <Link href="/painel/membros">Membros</Link>
        <Link href="/painel/vinculos">Vínculos</Link>
        <Link href="/painel/desafios">Desafios</Link>
      </nav>
      <main>{children}</main>
    </div>
  );
}
