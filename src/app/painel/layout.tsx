import { redirect } from "next/navigation";
import type { ReactNode } from "react";
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
        <span>Painel</span>
      </nav>
      <main>{children}</main>
    </div>
  );
}
