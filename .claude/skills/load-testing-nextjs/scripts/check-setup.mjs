#!/usr/bin/env node
// Diz o que falta configurar nesta skill para este projeto. Exit 0 = PRONTO.
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const DIR = path.dirname(fileURLToPath(import.meta.url));

const pendencias = [];

// 1. loadtest.js precisa declarar ao menos um `export default function`
//    (o handler de cenário do k6) com conteúdo além de comentário/import.
const loadtestPath = path.join(DIR, "loadtest.js");
const loadtestSrc = existsSync(loadtestPath) ? readFileSync(loadtestPath, "utf-8") : "";
const semComentarios = loadtestSrc
  .replace(/\/\/.*$/gm, "")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .trim();
const temDefaultExport = /export\s+default\s+function/.test(semComentarios);
if (!temDefaultExport) {
  pendencias.push(
    "scripts/loadtest.js — vazio (sem `export default function`). Escreva os cenários (ver references/loadtest-script-template.md).",
  );
}

// 2. seed-load-test-users.ts precisa de SEED_CONFIGURED = true
const seedPath = path.join(DIR, "seed-load-test-users.ts");
const seedSrc = existsSync(seedPath) ? readFileSync(seedPath, "utf-8") : "";
if (!/SEED_CONFIGURED\s*=\s*true/.test(seedSrc)) {
  pendencias.push(
    "scripts/seed-load-test-users.ts — SEED_CONFIGURED ainda é false. Preencha grantAccess/hasAccess e mude a flag.",
  );
}

// 3. loadtest.env precisa de LOADTEST_ENV_CONFIGURED=1
const envPath = path.join(DIR, "loadtest.env");
const envSrc = existsSync(envPath) ? readFileSync(envPath, "utf-8") : "";
if (!/^LOADTEST_ENV_CONFIGURED=1\s*$/m.test(envSrc)) {
  pendencias.push(
    "scripts/loadtest.env — LOADTEST_ENV_CONFIGURED ainda é 0. Preencha DATABASE_URL de teste e as demais variáveis.",
  );
}

if (pendencias.length > 0) {
  console.log("PENDENTE\n");
  for (const p of pendencias) console.log(`- ${p}`);
  process.exit(1);
}

console.log("PRONTO");
process.exit(0);
