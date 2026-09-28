// Cenário k6 para comunidade-belle-et-belle.
// Cobre: /login (público), /feed e /cliente/perfil (autenticado, via cookie
// de sessão semeado por seed-load-test-users.ts).
import http from "k6/http";
import { check, group, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3100";
const ALLOW_EXPENSIVE = __ENV.ALLOW_EXPENSIVE === "1";

const seed = JSON.parse(open(__ENV.SEED_FILE));
const cookieHeader = Object.entries(seed.cookies)
  .map(([nome, valor]) => `${nome}=${valor}`)
  .join("; ");
const headersAutenticado = { Cookie: cookieHeader };

export const errorRate = new Rate("errors");
export const loginDuration = new Trend("login_duration", true);
export const feedDuration = new Trend("feed_duration", true);
export const perfilDuration = new Trend("perfil_duration", true);

export const options = {
  scenarios: {
    default: {
      executor: "constant-vus",
      vus: Number(__ENV.K6_VUS) || 10,
      duration: __ENV.K6_DURATION || "1m",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<800", "p(99)<1500"],
  },
  summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"],
};

export default function () {
  group("login (publico, sem sessao)", function () {
    const res = http.get(`${BASE_URL}/login`);
    loginDuration.add(res.timings.duration);
    const ok = check(res, { "login: status 200": (r) => r.status === 200 });
    errorRate.add(!ok);
  });

  group("feed (autenticado)", function () {
    const res = http.get(`${BASE_URL}/feed`, { headers: headersAutenticado });
    feedDuration.add(res.timings.duration);
    const ok = check(res, { "feed: status 200": (r) => r.status === 200 });
    errorRate.add(!ok);
  });

  group("cliente/perfil (autenticado)", function () {
    const res = http.get(`${BASE_URL}/cliente/perfil`, { headers: headersAutenticado });
    perfilDuration.add(res.timings.duration);
    const ok = check(res, { "perfil: status 200": (r) => r.status === 200 });
    errorRate.add(!ok);
  });

  // Rota cara (gera imagem com sharp/Satori) — fora do cenário padrão.
  if (ALLOW_EXPENSIVE) {
    group("poster de desafio [expensive]", function () {
      const res = http.get(`${BASE_URL}/cliente/desafios/poster`, {
        headers: headersAutenticado,
      });
      check(res, { "poster: status 200 ou 404 (sem desafio encerrado)": (r) => r.status === 200 || r.status === 404 });
    });
  }

  sleep(1);
}
