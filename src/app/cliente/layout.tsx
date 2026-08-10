import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import {
  podeAcessarAreaCliente,
  podeAcessarDesafiosCliente,
} from "@/lib/auth/pode-acessar-painel";
import { SubNav } from "@/components/sub-nav";

export default async function ClienteLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session?.user || !podeAcessarDesafiosCliente(session.user.papeis)) {
    redirect("/");
  }

  // GESTORA/ADMIN só têm acesso a /cliente/desafios (ver escopo em
  // cliente/desafios/page.tsx). O resto de /cliente/* continua exigindo
  // CLIENTE via guard próprio em cada page.tsx, então a SubNav — que linka
  // pra todas as sub-rotas — só faz sentido pra quem de fato tem CLIENTE.
  const ehCliente = podeAcessarAreaCliente(session.user.papeis);

  return (
    <div>
      {ehCliente && (
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
      )}
      <main>{children}</main>
    </div>
  );
}
