import { Home, User, Handshake, Shield, Trophy, type LucideIcon } from "lucide-react";
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

  if (podeAcessarAreaCliente(papeis) || podeAcessarPainel(papeis)) {
    itens.push({
      href: "/cliente/desafios",
      label: "Desafios",
      Icone: Trophy,
      prefixoAtivo: "/cliente/desafios",
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

// Alguns prefixos aninham (ex: "/cliente" e "/cliente/desafios"), então mais
// de um item pode bater com pathname.startsWith. Só o prefixo mais específico
// (mais longo) deve ficar marcado como ativo.
export function obterPrefixoAtivo(
  itens: ItemNavegacaoPrincipal[],
  pathname: string,
): string | null {
  const correspondentes = itens
    .map((item) => item.prefixoAtivo)
    .filter((prefixo) => pathname.startsWith(prefixo));

  if (correspondentes.length === 0) {
    return null;
  }

  return correspondentes.reduce((maisEspecifico, atual) =>
    atual.length > maisEspecifico.length ? atual : maisEspecifico,
  );
}
