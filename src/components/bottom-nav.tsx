"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Papel } from "@/generated/prisma/client";
import { itensNavegacaoPrincipal } from "@/lib/nav/itens-navegacao-principal";
import { cn } from "@/lib/utils";

export function BottomNav({ papeis }: { papeis: Papel[] }) {
  const pathname = usePathname();
  const itens = itensNavegacaoPrincipal(papeis);

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background md:hidden"
    >
      <div className="mx-auto flex h-16 w-full max-w-lg items-stretch">
        {itens.map(({ href, label, Icone, prefixoAtivo }) => {
          const ativo = pathname.startsWith(prefixoAtivo);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium",
                ativo ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icone className="size-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
