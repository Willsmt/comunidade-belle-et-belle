import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { decideRoute } from "@/lib/auth/route-decision";

export default auth((req) => {
  const usuario = req.auth?.user
    ? {
        status: req.auth.user.status,
        temConsentimento: req.auth.user.temConsentimento,
      }
    : null;

  const decisao = decideRoute(usuario, req.nextUrl.pathname);

  if (decisao.action === "redirect") {
    return NextResponse.redirect(new URL(decisao.to, req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
