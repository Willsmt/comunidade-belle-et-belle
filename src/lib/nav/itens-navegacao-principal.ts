import { Home, User, Handshake, Shield, type LucideIcon } from "lucide-react";
import type { Papel } from "@/generated/prisma/client";
import {
  podeAcessarAreaCliente,
  podeAcessarAreaParceria,
  podeAcessarPainel,
} from "@/lib/auth/pode-acessar-painel";

export type ItemNavegacaoPrincipal = {
  href: string;
  label: string;
  Icone: LucideIcon;
  prefixoAtivo: string;
};

export function itensNavegacaoPrincipal(papeis: Papel[]): ItemNavegacaoPrincipal[] {
  const itens: ItemNavegacaoPrincipal[] = [
    { href: "/feed", label: "Feed", Icone: Home, prefixoAtivo: "/feed" },
  ];

  if (podeAcessarAreaCliente(papeis)) {
    itens.push({
      href: "/cliente/medidas",
      label: "Área da cliente",
      Icone: User,
      prefixoAtivo: "/cliente",
    });
  }

  if (podeAcessarAreaParceria(papeis)) {
    itens.push({
      href: "/parceria/planos",
      label: "Área da parceria",
      Icone: Handshake,
      prefixoAtivo: "/parceria",
    });
  }

  if (podeAcessarPainel(papeis)) {
    itens.push({
      href: "/painel/aprovacoes",
      label: "Painel",
      Icone: Shield,
      prefixoAtivo: "/painel",
    });
  }

  return itens;
}
