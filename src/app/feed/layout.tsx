import type { ReactNode } from "react";
import Link from "next/link";

export default function FeedLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <nav aria-label="Feed">
        <Link href="/feed">Feed</Link>
        <Link href="/feed/novo">Novo post</Link>
      </nav>
      <main>{children}</main>
    </div>
  );
}
