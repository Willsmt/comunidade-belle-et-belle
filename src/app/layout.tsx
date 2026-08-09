import type { Metadata } from "next";
import { Marcellus, Hanken_Grotesk, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthSessionProvider } from "@/components/providers/auth-session-provider";
import { HeaderPrincipal } from "@/components/header-principal";
import { BottomNav } from "@/components/bottom-nav";
import { auth } from "@/auth";
import { deveMostrarNavegacaoPrincipal } from "@/lib/auth/deve-mostrar-nav";
import { cn } from "@/lib/utils";

const marcellus = Marcellus({
  variable: "--font-marcellus",
  subsets: ["latin"],
  weight: "400",
});
const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Comunidade Belle et Belle",
  description:
    "Comunidade exclusiva para clientes da Belle et Belle by Patrícia Almeida.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  const papeis = session?.user?.papeis ?? [];
  const mostrarNav = deveMostrarNavegacaoPrincipal(
    session?.user
      ? {
          status: session.user.status,
          temConsentimento: session.user.temConsentimento,
        }
      : null,
  );

  return (
    <html
      lang="pt-BR"
      className={`${marcellus.variable} ${hankenGrotesk.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthSessionProvider>
          {mostrarNav && <HeaderPrincipal papeis={papeis} />}
          <div className={cn("flex-1", mostrarNav && "pt-14 pb-16 md:pb-0")}>
            {children}
          </div>
          {mostrarNav && <BottomNav papeis={papeis} />}
        </AuthSessionProvider>
      </body>
    </html>
  );
}
