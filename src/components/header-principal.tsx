"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, User } from "lucide-react";
import type { Papel } from "@/generated/prisma/client";
import { sair } from "@/lib/auth/actions";
import { itensNavegacaoPrincipal } from "@/lib/nav/itens-navegacao-principal";
import { podeAcessarAreaCliente } from "@/lib/auth/pode-acessar-painel";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HeaderPrincipal({ papeis }: { papeis: Papel[] }) {
  const pathname = usePathname();
  const itens = itensNavegacaoPrincipal(papeis);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex h-14 w-full max-w-lg items-center justify-between px-4 md:grid md:max-w-3xl md:grid-cols-[1fr_auto_1fr] md:px-6">
        <span className="font-heading text-lg text-foreground md:justify-self-start">
          Belle et Belle
        </span>

        <nav
          aria-label="Navegação principal"
          className="hidden md:flex md:items-center md:justify-self-center md:gap-6"
        >
          {itens.map(({ href, label, prefixoAtivo }) => {
            const ativo = pathname.startsWith(prefixoAtivo);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  ativo ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1 md:justify-self-end">
          {podeAcessarAreaCliente(papeis) && (
            <Link
              href="/cliente/perfil"
              aria-label="Meu perfil"
              className={buttonVariants({ variant: "ghost", size: "icon" })}
            >
              <User />
            </Link>
          )}
          <form action={sair}>
            <Button type="submit" variant="ghost" size="icon" aria-label="Sair">
              <LogOut />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
