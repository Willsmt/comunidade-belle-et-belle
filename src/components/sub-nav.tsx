"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function SubNav({
  ariaLabel,
  links,
}: {
  ariaLabel: string;
  links: { href: string; label: string }[];
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={ariaLabel}
      className="scrollbar-none flex gap-1 overflow-x-auto border-b border-border px-4 py-2"
    >
      {links.map((link) => {
        const ativo = pathname === link.href;
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
    </nav>
  );
}
