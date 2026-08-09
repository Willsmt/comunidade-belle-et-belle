import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import { podeAcessarPainel } from "@/lib/auth/pode-acessar-painel";
import { SubNav } from "@/components/sub-nav";

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
      <SubNav
        ariaLabel="Painel de gerenciamento"
        links={[
          { href: "/painel/aprovacoes", label: "Aprovações" },
          { href: "/painel/membros", label: "Membros" },
          { href: "/painel/vinculos", label: "Vínculos" },
          { href: "/painel/desafios", label: "Desafios" },
        ]}
      />
      <main>{children}</main>
    </div>
  );
}
