// Cenário k6 para comunidade-belle-et-belle.
//
// Cobre as páginas de leitura das quatro personas (anônima, cliente, gestora,
// parceria), com peso aproximando o tráfego esperado de uma comunidade: a
// maior parte é cliente navegando feed/desafios. Dados e sessões vêm de
// seed-load-test-users.ts (.seed-output.json).
//
// FORA do cenário (e por quê):
//   - Server Actions (curtir, comentar, criar post, marcar item, registrar
//     medida…): todas são disparadas por onClick/onSubmit com preventDefault
//     (useAcaoComErro), não por <form action={fn}>; não existe envio "sem JS"
//     para imitar, só o protocolo interno Next-Action/Flight, cujo id muda a
//     cada build — fora de escopo por decisão da skill (k6-patterns.md).
//   - Uploads (fotos, comprovantes, PDFs de plano): iriam ao R2 real.
//   - /cliente/desafios/poster: gera imagem com sharp/next/og (caro) —
//     só roda com --allow-expensive.
//   - /bem-vinda, /aguardando-aprovacao, /conta-suspensa: telas de gate para
//     contas em outros estados; tráfego marginal.
//   - /painel (placeholder estático "Em breve").
import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3100";
const ALLOW_EXPENSIVE = __ENV.ALLOW_EXPENSIVE === "1";

const seed = JSON.parse(open(__ENV.SEED_FILE));
const NOME_COOKIE = "authjs.session-token";

const clientes = seed.clientes;
const postsProprios = clientes.filter((c) => c.postId);
const cursores = postsProprios.map((c) => c.postId);

function pick(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

// Cada VU "é" uma cliente fixa (sessões diferentes, dados diferentes).
function clienteDaVu() {
  return clientes[(__VU - 1) % clientes.length];
}

function cookiesDe(usuario) {
  // replace: true — o jar da VU nunca mistura a sessão de outra persona.
  return { [NOME_COOKIE]: { value: usuario.cookies[NOME_COOKIE], replace: true } };
}

const SO_200 = http.expectedStatuses(200);

// name estável (tag) | persona | peso | path | status esperado | marcador no HTML
const ROTAS = [
  { name: "login", persona: "anon", peso: 3, domain: "auth", path: () => "/login", marcador: "Entrar" },
  { name: "/ (redirect)", persona: "cliente", peso: 2, domain: "feed", path: () => "/", status: 307 },

  { name: "feed", persona: "cliente", peso: 26, domain: "feed", path: () => "/feed", marcador: "Novo post" },
  { name: "feed?cursor", persona: "cliente", peso: 4, domain: "feed", path: () => `/feed?cursor=${pick(cursores)}`, marcador: "Novo post" },
  { name: "feed/novo", persona: "cliente", peso: 3, domain: "feed", path: () => "/feed/novo", marcador: "Novo post" },
  { name: "feed/:postId/editar", persona: "cliente-com-post", peso: 1, domain: "feed", path: (u) => `/feed/${u.postId}/editar`, marcador: "Editar post" },
  { name: "cliente/desafios", persona: "cliente", peso: 14, domain: "desafios", path: () => "/cliente/desafios", marcador: "Desafio ativo" },
  { name: "perfil/:clienteId", persona: "cliente", peso: 7, domain: "perfil", path: () => `/perfil/${pick(clientes).id}`, marcador: "Emblemas" },
  { name: "cliente/medidas", persona: "cliente", peso: 6, domain: "medidas", path: () => "/cliente/medidas", marcador: "Minhas medidas" },
  { name: "cliente/fotos", persona: "cliente", peso: 3, domain: "perfil", path: () => "/cliente/fotos", marcador: "Minhas fotos" },
  { name: "cliente/planos", persona: "cliente", peso: 3, domain: "parcerias", path: () => "/cliente/planos", marcador: "Meus planos" },
  { name: "cliente/parcerias", persona: "cliente", peso: 2, domain: "parcerias", path: () => "/cliente/parcerias", marcador: "Minhas parcerias" },
  { name: "cliente/perfil", persona: "cliente", peso: 3, domain: "perfil", path: () => "/cliente/perfil", marcador: "Meu perfil" },

  { name: "painel/aprovacoes", persona: "gestora", peso: 3, domain: "painel", path: () => "/painel/aprovacoes", marcador: "Aprovações pendentes" },
  { name: "painel/membros", persona: "gestora", peso: 3, domain: "painel", path: () => "/painel/membros", marcador: "Membros" },
  { name: "painel/membros/:membroId", persona: "gestora", peso: 2, domain: "pacotes", path: () => `/painel/membros/${pick(seed.membrosComCicloIds)}`, marcador: "Pacote de sessões" },
  { name: "painel/vinculos", persona: "gestora", peso: 2, domain: "parcerias", path: () => "/painel/vinculos", marcador: "Vínculos" },
  { name: "painel/desafios", persona: "gestora", peso: 1, domain: "desafios", path: () => "/painel/desafios", marcador: "Desafios" },
  { name: "painel/desafios/:desafioId", persona: "gestora", peso: 2, domain: "desafios", path: () => `/painel/desafios/${seed.desafioAtivoId}`, marcador: "Desafio ativo" },
  { name: "painel/desafios/emblemas", persona: "gestora", peso: 1, domain: "desafios", path: () => "/painel/desafios/emblemas", marcador: "Emblemas" },
  { name: "painel/pacotes", persona: "gestora", peso: 1, domain: "pacotes", path: () => "/painel/pacotes", marcador: "Pacotes" },

  { name: "parceria/planos", persona: "parceria", peso: 3, domain: "parcerias", path: () => "/parceria/planos", marcador: "Meus planos" },
  { name: "parceria/medidas", persona: "parceria", peso: 2, domain: "medidas", path: () => "/parceria/medidas", marcador: "Medidas das clientes" },
  { name: "parceria/medidas/:clienteId", persona: "parceria", peso: 2, domain: "medidas", path: () => `/parceria/medidas/${pick(seed.clientesVinculadasIds)}`, marcador: "Medidas —" },
  { name: "parceria/perfil", persona: "parceria", peso: 1, domain: "parcerias", path: () => "/parceria/perfil", marcador: "Meu perfil" },
];

const PESO_TOTAL = ROTAS.reduce((soma, r) => soma + r.peso, 0);

// Threshold por rota: além de ser o gate por rota (p99 ≤ 3s, erro ≤ 1% —
// references/thresholds.md), é o que faz o k6 exportar a submétrica
// {name:...} no --summary-export; o analyze-results.mjs monta a tabela por
// rota a partir delas.
const thresholds = {
  http_req_failed: ["rate<0.01"],
  http_req_duration: ["p(95)<800", "p(99)<1500"],
  checks: ["rate>0.99"],
};
for (const r of ROTAS) {
  thresholds[`http_req_duration{name:${r.name}}`] = ["p(99)<3000"];
  thresholds[`http_req_failed{name:${r.name}}`] = ["rate<0.01"];
}

export const options = {
  scenarios: {
    default: {
      executor: "constant-vus",
      vus: Number(__ENV.K6_VUS) || 10,
      duration: __ENV.K6_DURATION || "1m",
    },
  },
  thresholds,
  summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)", "count"],
};

function usuarioDaPersona(persona) {
  if (persona === "anon") return null;
  if (persona === "gestora") return seed.gestora;
  if (persona === "parceria") return seed.parceria;
  if (persona === "cliente-com-post") {
    const propria = clienteDaVu();
    return propria.postId ? propria : pick(postsProprios);
  }
  return clienteDaVu();
}

function escolherRota() {
  let x = Math.random() * PESO_TOTAL;
  for (const r of ROTAS) {
    x -= r.peso;
    if (x < 0) return r;
  }
  return ROTAS[ROTAS.length - 1];
}

function visitar(rota) {
  const usuario = usuarioDaPersona(rota.persona);
  const esperado = rota.status || 200;
  const params = {
    tags: { name: rota.name, domain: rota.domain, kind: "read" },
    // Sem seguir redirect: um 307 do proxy para /login (sessão/gate
    // quebrado) tem que aparecer como falha, não como o 200 do /login.
    redirects: 0,
    responseCallback: esperado === 200 ? SO_200 : http.expectedStatuses(esperado),
  };
  if (usuario) params.cookies = cookiesDe(usuario);

  const res = http.get(`${BASE_URL}${rota.path(usuario)}`, params);
  check(
    res,
    {
      [`${rota.name}: status ${esperado}`]: (r) => r.status === esperado,
      [`${rota.name}: conteúdo esperado`]: (r) =>
        !rota.marcador || (typeof r.body === "string" && r.body.includes(rota.marcador)),
    },
    { name: rota.name },
  );
}

export default function () {
  visitar(escolherRota());

  // Rota cara (sharp/next/og) — fora do padrão; guard no corpo, não só tag.
  if (ALLOW_EXPENSIVE && Math.random() < 0.02) {
    const res = http.get(`${BASE_URL}/cliente/desafios/poster`, {
      cookies: cookiesDe(clienteDaVu()),
      tags: { name: "cliente/desafios/poster", domain: "desafios", kind: "read", expensive: "true" },
      redirects: 0,
    });
    check(res, { "poster: 200 ou 404": (r) => r.status === 200 || r.status === 404 });
  }

  // Think time médio de 1s entre páginas.
  sleep(0.5 + Math.random());
}
