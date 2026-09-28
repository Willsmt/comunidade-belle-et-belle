#!/usr/bin/env node
// Lista as rotas do App Router do projeto (páginas e route handlers), sem
// precisar subir a aplicação. Heurística baseada só na árvore de arquivos —
// não executa nenhum código do projeto.
//
// Uso: node list-routes.mjs [--dir src/app]
import { readdirSync, statSync, readFileSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const dirFlagIndex = args.indexOf("--dir");
const explicitDir = dirFlagIndex >= 0 ? args[dirFlagIndex + 1] : null;

function encontrarAppDir(cwd) {
  if (explicitDir) return path.resolve(cwd, explicitDir);
  for (const candidato of ["src/app", "app"]) {
    const p = path.resolve(cwd, candidato);
    try {
      if (statSync(p).isDirectory()) return p;
    } catch {
      // tenta o próximo
    }
  }
  throw new Error(
    "Não encontrei src/app nem app/ a partir do cwd. Rode a partir da raiz do projeto ou passe --dir.",
  );
}

const PASTA_ESPECIAL = /^(page|layout|route|loading|error|not-found|template|default|global-error)\.(js|jsx|ts|tsx)$/;
const ARQUIVOS_ARMADILHA = /^(loading|error|not-found|template|default|global-error)\./;

function segmentoParaUrl(nomePasta) {
  // Route group "(marketing)" não aparece na URL.
  if (/^\(.*\)$/.test(nomePasta)) return null;
  // Parallel route "@slot" não é navegável diretamente.
  if (nomePasta.startsWith("@")) return null;
  // Catch-all "[...slug]" / catch-all opcional "[[...slug]]".
  if (/^\[\[\.\.\..+\]\]$/.test(nomePasta)) return `:${nomePasta.slice(3, -2)}*?`;
  if (/^\[\.\.\..+\]$/.test(nomePasta)) return `:${nomePasta.slice(4, -1)}*`;
  // Segmento dinâmico "[id]".
  if (/^\[.+\]$/.test(nomePasta)) return `:${nomePasta.slice(1, -1)}`;
  return nomePasta;
}

function metodosDoRouteHandler(caminhoArquivo) {
  const src = readFileSync(caminhoArquivo, "utf-8");
  const metodos = [];
  for (const m of ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]) {
    const re = new RegExp(
      `export\\s+(async\\s+)?function\\s+${m}\\b` +
        `|export\\s+const\\s+${m}\\s*=` +
        `|export\\s+const\\s+\\{[^}]*\\b${m}\\b[^}]*\\}\\s*=`, // export const { GET, POST } = handlers
    );
    if (re.test(src)) metodos.push(m);
  }
  return metodos.length > 0 ? metodos : ["?"];
}

function ehEstaticoForcado(caminhoArquivo) {
  try {
    const src = readFileSync(caminhoArquivo, "utf-8");
    return /dynamic\s*=\s*["']force-static["']/.test(src);
  } catch {
    return false;
  }
}

function caminharApp(dirAtual, segmentosUrl, rotas) {
  const entradas = readdirSync(dirAtual, { withFileTypes: true });

  for (const entrada of entradas) {
    if (!entrada.isFile()) continue;
    if (!PASTA_ESPECIAL.test(entrada.name)) continue;
    if (ARQUIVOS_ARMADILHA.test(entrada.name)) continue;

    const caminhoArquivo = path.join(dirAtual, entrada.name);
    const url = "/" + segmentosUrl.filter(Boolean).join("/");

    if (entrada.name.startsWith("page.")) {
      rotas.push({ url: url || "/", tipo: "page", metodos: ["GET"] });
    } else if (entrada.name.startsWith("route.")) {
      rotas.push({
        url: url || "/",
        tipo: "route",
        metodos: metodosDoRouteHandler(caminhoArquivo),
        estatico: ehEstaticoForcado(caminhoArquivo),
      });
    }
  }

  for (const entrada of entradas) {
    if (!entrada.isDirectory()) continue;
    const segmento = segmentoParaUrl(entrada.name);
    caminharApp(
      path.join(dirAtual, entrada.name),
      segmento === null ? segmentosUrl : [...segmentosUrl, segmento],
      rotas,
    );
  }
}

const appDir = encontrarAppDir(process.cwd());
const rotas = [];
caminharApp(appDir, [], rotas);
rotas.sort((a, b) => a.url.localeCompare(b.url));

for (const r of rotas) {
  const flag = r.estatico ? " [force-static — não mede o caminho dinâmico]" : "";
  console.log(`${r.metodos.join(",").padEnd(18)} ${r.url}${flag}`);
}

console.error(`\n${rotas.length} rotas encontradas em ${path.relative(process.cwd(), appDir)}/`);
console.error(
  "Middleware e Server Actions não aparecem aqui — leia middleware.ts e os arquivos \"use server\" à parte (ver discovery-checklist.md).",
);
