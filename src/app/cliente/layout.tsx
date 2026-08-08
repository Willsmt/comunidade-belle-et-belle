import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import Link from "next/link";
import { auth } from "@/auth";
import { podeAcessarAreaCliente } from "@/lib/auth/pode-acessar-painel";

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
      <nav aria-label="Área da cliente">
        <Link href="/cliente/medidas">Minhas medidas</Link>
        <Link href="/cliente/perfil">Meu perfil</Link>
      </nav>
      <main>{children}</main>
    </div>
  );
}
