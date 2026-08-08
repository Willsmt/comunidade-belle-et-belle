import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { decideRoute } from "@/lib/auth/route-decision";

export const runtime = "nodejs";

const ROTAS_PUBLICAS = ["/login", "/api/auth"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (ROTAS_PUBLICAS.some((rota) => pathname.startsWith(rota))) {
    return NextResponse.next();
  }

  const usuario = req.auth?.user
    ? {
        status: req.auth.user.status,
        temConsentimento: req.auth.user.temConsentimento,
      }
    : null;

  const decisao = decideRoute(usuario, pathname);

  if (decisao.action === "redirect") {
    return NextResponse.redirect(new URL(decisao.to, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
