import type { StatusConta } from "@/generated/prisma/client";

export type RouteDecision =
  | { action: "next" }
  | { action: "redirect"; to: string };

const ROTA_LOGIN = "/login";
const ROTA_AGUARDANDO = "/aguardando-aprovacao";
const ROTA_SUSPENSA = "/conta-suspensa";
const ROTA_BOAS_VINDAS = "/bem-vinda";

const ROTAS_DE_GATE = [ROTA_LOGIN, ROTA_AGUARDANDO, ROTA_SUSPENSA, ROTA_BOAS_VINDAS];

type SessaoUsuario = {
  status: StatusConta;
  temConsentimento: boolean;
} | null;

export function decideRoute(
  usuario: SessaoUsuario,
  pathname: string,
): RouteDecision {
  if (!usuario) {
    return pathname === ROTA_LOGIN
      ? { action: "next" }
      : { action: "redirect", to: ROTA_LOGIN };
  }

  if (usuario.status === "SUSPENSO") {
    return pathname === ROTA_SUSPENSA
      ? { action: "next" }
      : { action: "redirect", to: ROTA_SUSPENSA };
  }

  if (usuario.status === "PENDENTE") {
    return pathname === ROTA_AGUARDANDO
      ? { action: "next" }
      : { action: "redirect", to: ROTA_AGUARDANDO };
  }

  if (usuario.status === "ATIVO" && !usuario.temConsentimento) {
    return pathname === ROTA_BOAS_VINDAS
      ? { action: "next" }
      : { action: "redirect", to: ROTA_BOAS_VINDAS };
  }

  if (ROTAS_DE_GATE.includes(pathname)) {
    return { action: "redirect", to: "/" };
  }

  return { action: "next" };
}
