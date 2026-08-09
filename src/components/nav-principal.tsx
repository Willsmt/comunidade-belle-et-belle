import Link from "next/link";
import type { Papel } from "@/generated/prisma/client";
import {
  podeAcessarAreaCliente,
  podeAcessarAreaParceria,
  podeAcessarPainel,
} from "@/lib/auth/pode-acessar-painel";

export function NavPrincipal({ papeis }: { papeis: Papel[] }) {
  return (
    <nav aria-label="Navegação principal">
      <Link href="/feed">Feed</Link>
      {podeAcessarAreaCliente(papeis) && (
        <Link href="/cliente/medidas">Área da cliente</Link>
      )}
      {podeAcessarAreaParceria(papeis) && (
        <Link href="/parceria/planos">Área da parceria</Link>
      )}
      {podeAcessarPainel(papeis) && (
        <Link href="/painel/aprovacoes">Painel</Link>
      )}
    </nav>
  );
}
