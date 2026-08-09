import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import { podeAcessarAreaCliente } from "@/lib/auth/pode-acessar-painel";
import { SubNav } from "@/components/sub-nav";

export default async function ClienteLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session?.user || !podeAcessarAreaCliente(session.user.papeis)) {
    redirect("/");
  }

  return (
    <div>
      <SubNav
        ariaLabel="Área da cliente"
        links={[
          { href: "/cliente/medidas", label: "Minhas medidas" },
          { href: "/cliente/perfil", label: "Meu perfil" },
          { href: "/cliente/fotos", label: "Minhas fotos" },
          { href: "/cliente/planos", label: "Meus planos" },
          { href: "/cliente/parcerias", label: "Minhas parcerias" },
          { href: "/cliente/desafios", label: "Desafios" },
        ]}
      />
      <main>{children}</main>
    </div>
  );
}
