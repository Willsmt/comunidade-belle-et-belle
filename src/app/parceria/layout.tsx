import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import Link from "next/link";
import { auth } from "@/auth";
import { podeAcessarAreaParceria } from "@/lib/auth/pode-acessar-painel";

export default async function ParceriaLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session?.user || !podeAcessarAreaParceria(session.user.papeis)) {
    redirect("/");
  }

  return (
    <div>
      <nav aria-label="Área da parceria">
        <Link href="/parceria/planos">Meus planos</Link>
        <Link href="/parceria/perfil">Meu perfil</Link>
      </nav>
      <main>{children}</main>
    </div>
  );
}
