import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import { podeAcessarAreaParceria } from "@/lib/auth/pode-acessar-painel";
import { SubNav } from "@/components/sub-nav";

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
      <SubNav
        ariaLabel="Área da parceria"
        links={[
          { href: "/parceria/planos", label: "Meus planos" },
          { href: "/parceria/perfil", label: "Meu perfil" },
        ]}
      />
      <main>{children}</main>
    </div>
  );
}
