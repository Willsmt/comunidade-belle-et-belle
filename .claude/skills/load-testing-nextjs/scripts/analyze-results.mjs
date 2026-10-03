#!/usr/bin/env node
// Lê o summary-export do k6 (JSON) e produz um relatório em Markdown + gate
// de aprovação. Uso:
//   node analyze-results.mjs <summary.json> [--baseline arquivo.json]
//                                            [--update-baseline]
//                                            [--out RELATORIO.md]
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const summaryPath = args[0];
if (!summaryPath) {
  console.error("Uso: node analyze-results.mjs <summary.json> [--baseline f.json] [--update-baseline] [--out f.md]");
  process.exit(2);
}
function flag(nome, padrao = null) {
  const i = args.indexOf(nome);
  return i >= 0 ? args[i + 1] : padrao;
}
const baselinePath = flag("--baseline");
const outPath = flag("--out");
const updateBaseline = args.includes("--update-baseline");

const LIMITES = {
  errorRate: { ok: 0.005, atencao: 0.01 },
  p95: { ok: 800, atencao: 1500 },
  p99: { ok: 1500, atencao: 3000 },
  regressaoP95: { ok: 0.1, atencao: 0.25 },
  quedaRps: { ok: 0.1, atencao: 0.2 },
};

function status(valor, { ok, atencao }, maiorEhPior = true) {
  const comparaOk = maiorEhPior ? valor <= ok : valor >= ok;
  const comparaAtencao = maiorEhPior ? valor <= atencao : valor >= atencao;
  if (comparaOk) return "✅";
  if (comparaAtencao) return "⚠️";
  return "❌";
}

let summary;
try {
  summary = JSON.parse(readFileSync(summaryPath, "utf-8"));
} catch (erro) {
  console.error(`Não consegui ler ${summaryPath}:`, erro.message);
  process.exit(2);
}

const m = summary.metrics ?? {};
const httpReqs = m.http_reqs ?? { count: 0, rate: 0 };
const httpDur = m.http_req_duration ?? {};
const httpFailed = m.http_req_failed ?? { value: 0 };

const p95 = httpDur["p(95)"];
const p99 = httpDur["p(99)"];
const errorRate = httpFailed.value ?? 0;
const rps = httpReqs.rate ?? 0;
const totalReqs = httpReqs.count ?? 0;

if (p95 === undefined || p99 === undefined) {
  console.error(
    'Aviso: p(95)/p(99) ausentes no summary. Configure `summaryTrendStats: ["avg","min","med","max","p(90)","p(95)","p(99)"]` em options no loadtest.js.',
  );
}

const falhasCriticas = [];
if (totalReqs < 100) falhasCriticas.push(`Total de requests (${totalReqs}) abaixo de 100 — run inválido.`);
if (errorRate > LIMITES.errorRate.atencao) falhasCriticas.push(`Taxa de erro ${(errorRate * 100).toFixed(2)}% acima de ${LIMITES.errorRate.atencao * 100}%.`);
if (p95 !== undefined && p95 > LIMITES.p95.atencao) falhasCriticas.push(`p95 ${p95.toFixed(0)}ms acima de ${LIMITES.p95.atencao}ms.`);
if (p99 !== undefined && p99 > LIMITES.p99.atencao) falhasCriticas.push(`p99 ${p99.toFixed(0)}ms acima de ${LIMITES.p99.atencao}ms.`);

// --- Por rota (extensão): lê as submétricas http_req_duration{name:X} /
// http_req_failed{name:X}, que o k6 só exporta quando o loadtest.js declara
// um threshold para elas. Aplica o gate por rota de references/thresholds.md
// (p99 > 3s ou erro > 1% reprova, mesmo com o agregado ok).
const LIMITE_ROTA = { p99: 3000, erro: 0.01 };
const rotas = [];
for (const [chave, valor] of Object.entries(m)) {
  const casamento = /^http_req_duration\{name:(.+)\}$/.exec(chave);
  if (!casamento) continue;
  const nome = casamento[1];
  const falhas = m[`http_req_failed{name:${nome}}`];
  const totalFalhas = falhas ? (falhas.passes ?? 0) : 0;
  const totalRota = falhas ? (falhas.passes ?? 0) + (falhas.fails ?? 0) : (valor.count ?? 0);
  rotas.push({
    nome,
    reqs: valor.count ?? totalRota,
    p50: valor.med,
    p95: valor["p(95)"],
    p99: valor["p(99)"],
    erro: totalRota > 0 ? totalFalhas / totalRota : 0,
    erros: totalFalhas,
  });
}
rotas.sort((a, b) => (b.p95 ?? 0) - (a.p95 ?? 0));
for (const r of rotas) {
  if (!r.reqs) falhasCriticas.push(`Rota ${r.nome} sem nenhum request (contagem 0) — cenário não a exercitou.`);
  if ((r.p99 ?? 0) > LIMITE_ROTA.p99) falhasCriticas.push(`Rota ${r.nome}: p99 ${r.p99.toFixed(0)}ms acima de ${LIMITE_ROTA.p99}ms.`);
  if (r.erro > LIMITE_ROTA.erro) falhasCriticas.push(`Rota ${r.nome}: erro ${(r.erro * 100).toFixed(2)}% acima de ${LIMITE_ROTA.erro * 100}%.`);
}

// Checks (status + conteúdo esperado): um 200 com a página errada não é sucesso.
const checks = m.checks;
const taxaChecks = checks ? checks.value : null;
if (taxaChecks !== null && taxaChecks !== undefined && taxaChecks < 0.99) {
  falhasCriticas.push(`Checks aprovados ${(taxaChecks * 100).toFixed(2)}% (< 99%) — respostas com status/conteúdo inesperado.`);
}

let baseline = null;
if (baselinePath && existsSync(baselinePath)) {
  baseline = JSON.parse(readFileSync(baselinePath, "utf-8"));
}

let deltaP95 = null;
let deltaRps = null;
if (baseline) {
  deltaP95 = (p95 - baseline.p95) / baseline.p95;
  deltaRps = (baseline.rps - rps) / baseline.rps;
  if (deltaP95 > LIMITES.regressaoP95.atencao) falhasCriticas.push(`p95 regrediu ${(deltaP95 * 100).toFixed(1)}% vs baseline (limite ${LIMITES.regressaoP95.atencao * 100}%).`);
  if (deltaRps > LIMITES.quedaRps.atencao) falhasCriticas.push(`RPS caiu ${(deltaRps * 100).toFixed(1)}% vs baseline (limite ${LIMITES.quedaRps.atencao * 100}%).`);
}

const veredito = falhasCriticas.length > 0 ? "❌ REPROVADO" : errorRate > LIMITES.errorRate.ok || (p95 ?? 0) > LIMITES.p95.ok ? "⚠️ APROVADO COM RESSALVAS" : "✅ APROVADO";

const linhas = [];
linhas.push(`# Teste de carga — resultado`, "");
linhas.push(`**Veredito**: ${veredito}`, "");
linhas.push(`| Métrica | Valor | Limite | Status |`);
linhas.push(`| --- | ---: | ---: | :---: |`);
linhas.push(`| Requests/s | ${rps.toFixed(2)} | — | — |`);
linhas.push(`| Total de requests | ${totalReqs} | ≥ 100 | ${totalReqs >= 100 ? "✅" : "❌"} |`);
linhas.push(`| Taxa de erro | ${(errorRate * 100).toFixed(2)}% | < ${LIMITES.errorRate.ok * 100}% | ${status(errorRate, LIMITES.errorRate)} |`);
if (httpDur.med !== undefined) linhas.push(`| p50 | ${httpDur.med.toFixed(0)} ms | — | — |`);
if (taxaChecks !== null && taxaChecks !== undefined) linhas.push(`| Checks aprovados | ${(taxaChecks * 100).toFixed(2)}% | ≥ 99% | ${taxaChecks >= 0.99 ? "✅" : "❌"} |`);
if (p95 !== undefined) linhas.push(`| p95 | ${p95.toFixed(0)} ms | ≤ ${LIMITES.p95.ok} ms | ${status(p95, LIMITES.p95)} |`);
if (p99 !== undefined) linhas.push(`| p99 | ${p99.toFixed(0)} ms | ≤ ${LIMITES.p99.ok} ms | ${status(p99, LIMITES.p99)} |`);
linhas.push("");

if (rotas.length > 0) {
  const ms = (v) => (v === undefined ? "—" : `${v.toFixed(0)} ms`);
  linhas.push(`## Por rota (ordenado por p95)`, "");
  linhas.push(`| Rota | Reqs | p50 | p95 | p99 | Erros |`);
  linhas.push(`| --- | ---: | ---: | ---: | ---: | ---: |`);
  for (const r of rotas) {
    linhas.push(`| ${r.nome} | ${r.reqs} | ${ms(r.p50)} | ${ms(r.p95)} | ${ms(r.p99)} | ${r.erros} (${(r.erro * 100).toFixed(2)}%) |`);
  }
  linhas.push("");
}

if (baseline) {
  linhas.push(`## Comparação com o baseline (${baseline.capturedAt ?? "?"})`, "");
  linhas.push(`- Δ p95: ${(deltaP95 * 100).toFixed(1)}% ${status(deltaP95, LIMITES.regressaoP95)}`);
  linhas.push(`- Δ RPS: ${(-deltaRps * 100).toFixed(1)}% ${status(deltaRps, LIMITES.quedaRps)}`);
  linhas.push("");
} else if (baselinePath) {
  linhas.push(`## Baseline`, "", "Nenhum baseline encontrado em `" + baselinePath + "` — este run pode virar o baseline inicial (rode 3× e use --update-baseline).", "");
}

if (falhasCriticas.length > 0) {
  linhas.push(`## Motivo da reprovação`, "");
  for (const f of falhasCriticas) linhas.push(`- ${f}`);
  linhas.push("");
}

const relatorio = linhas.join("\n");
console.log(relatorio);

if (outPath) writeFileSync(outPath, relatorio);

if (updateBaseline && baselinePath) {
  if (veredito === "❌ REPROVADO") {
    console.error("\nRun reprovado — não promovendo a baseline.");
    process.exit(1);
  }
  writeFileSync(
    baselinePath,
    JSON.stringify({ rps, p95, p99, errorRate, totalReqs, capturedAt: new Date().toISOString() }, null, 2) + "\n",
  );
  console.error(`\nBaseline atualizado em ${baselinePath}`);
}

process.exit(veredito === "❌ REPROVADO" ? 1 : 0);
