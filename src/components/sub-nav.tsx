"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function SubNav({
  ariaLabel,
  links,
}: {
  ariaLabel: string;
  links: { href: string; label: string }[];
}) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const idLista = useId();
  const itemAtivo = links.find((link) => link.href === pathname);

  return (
    <nav aria-label={ariaLabel} className="border-b border-border">
      <div className="md:hidden">
        <button
          type="button"
          data-testid="subnav-trigger"
          aria-expanded={aberto}
          aria-controls={idLista}
          onClick={() => setAberto((valor) => !valor)}
          className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium text-foreground"
        >
          {itemAtivo?.label ?? ariaLabel}
          <ChevronDown
            className={cn("size-4 text-muted-foreground transition-transform", aberto && "rotate-180")}
          />
        </button>

        {aberto && (
          <div id={idLista} data-testid="subnav-lista" className="flex flex-col gap-1.5 px-4 pb-3">
            {links.map((link) => {
              const ativo = link.href === pathname;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setAberto(false)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    ativo
                      ? "border-transparent bg-secondary text-secondary-foreground"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div
        data-testid="subnav-desktop"
        className="scrollbar-none hidden gap-1 overflow-x-auto px-4 py-2 md:flex md:justify-center"
      >
        {links.map((link) => {
          const ativo = link.href === pathname;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                ativo
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
