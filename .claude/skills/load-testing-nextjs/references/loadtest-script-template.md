# Esqueleto de `scripts/loadtest.js`

Cole isto em `scripts/loadtest.js` e adapte às rotas reais do projeto (ver
`discovery-checklist.md`). Comentários `// PROJETO:` marcam o que trocar.

```js
import http from "k6/http";
import { check, group, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3100";
const ALLOW_EXPENSIVE = __ENV.ALLOW_EXPENSIVE === "1";

// PROJETO: o run-load-test.sh grava aqui o retorno de seed-load-test-users.ts
// (JSON com { id, email, cookies }). Ajuste o formato do cookie ao provider.
const seed = JSON.parse(open(__ENV.SEED_FILE));
const cookieHeader = Object.entries(seed.cookies)
  .map(([nome, valor]) => `${nome}=${valor}`)
  .join("; ");
const headersAutenticado = { Cookie: cookieHeader };

export const errorRate = new Rate("errors");
// PROJETO: um Trend por rota/grupo quente ajuda a achar o gargalo específico
// sem precisar reprocessar o CSV depois.
export const paginaXDuration = new Trend("pagina_x_duration", true);

export const options = {
  scenarios: {
    default: {
      executor: "constant-vus",
      // vus/duration vêm de --vus/--duration do run-load-test.sh; aqui é só
      // o fallback pra quando o script roda direto com `k6 run`.
      vus: Number(__ENV.K6_VUS) || 10,
      duration: __ENV.K6_DURATION || "1m",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<800", "p(99)<1500"],
  },
  // Sem isso, p(99) não aparece no --summary-export (só p90/p95 saem por
  // padrão) e o analyze-results.mjs não consegue aplicar o gate de p99.
  summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"],
};

export default function () {
  // PROJETO: rota pública, sem cookie — ajuste o path.
  group("pagina publica", function () {
    const res = http.get(`${BASE_URL}/login`);
    const ok = check(res, { "200": (r) => r.status === 200 });
    errorRate.add(!ok);
  });

  // PROJETO: rota autenticada — repita um group por rota quente real.
  group("pagina X (autenticado)", function () {
    const res = http.get(`${BASE_URL}/rota-quente`, { headers: headersAutenticado });
    paginaXDuration.add(res.timings.duration);
    const ok = check(res, { "200": (r) => r.status === 200 });
    errorRate.add(!ok);
  });

  // PROJETO: POST via formulário real (Server Action), não a action isolada
  // — ver k6-patterns.md sobre por que chamar a action direta não vale o custo.
  group("submit de formulario", function () {
    const res = http.post(
      `${BASE_URL}/rota-do-formulario`,
      { campo: "valor de teste" },
      { headers: headersAutenticado },
    );
    const ok = check(res, { "sucesso ou redirect esperado": (r) => r.status < 400 });
    errorRate.add(!ok);
  });

  // PROJETO: rota cara (LLM, upload, cobrança) — fora do padrão.
  if (ALLOW_EXPENSIVE) {
    group("rota cara [expensive]", function () {
      const res = http.post(`${BASE_URL}/rota-cara`, {}, { headers: headersAutenticado });
      check(res, { "200": (r) => r.status === 200 });
    });
  }

  sleep(1);
}
```

## Descobrindo IDs reais para rotas dinâmicas

Nunca invente `/posts/algum-id-fixo`. Duas opções:

1. **Seed determinístico**: `seed-load-test-users.ts` cria também os registros
   necessários com IDs conhecidos (mais simples, mais rápido, preferível).
2. **Discovery em runtime**: uma requisição no `setup()` do k6 busca uma lista
   real (ex. `GET /api/posts`) e devolve os IDs pro `default()` usar — use só
   se o conjunto de dados precisa ser realista/variado (ver `k6-patterns.md`).

## Named URLs com id (evita explosão de métricas por URL)

Se o path tiver um id, marque a métrica com um nome estável:

```js
const res = http.get(`${BASE_URL}/posts/${id}`, {
  tags: { name: "posts/:id" },
});
```
