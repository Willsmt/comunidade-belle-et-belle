---
name: load-testing-nextjs
description: Teste de carga com k6 para QUALQUER projeto Next.js (App Router) — sobe a stack (Postgres via Docker + `next start`), roda o cenário headless, coleta RPS, p50/p95/p99 e taxa de erro, e compara com o baseline para aprovar ou reprovar. Versão portátil: o script k6 vem vazio e é escrito pelo agente load-test-runner-nextjs a partir do código do projeto. Use ao terminar/atualizar uma feature, antes de deploy, ao investigar lentidão sob concorrência, ou quando o usuário pedir "teste de carga", "load test", "k6", "quantos requests por segundo aguenta", "stress test", "benchmark de performance".
keywords:
  - teste de carga
  - load test
  - k6
  - stress test
  - benchmark
  - requests por segundo
  - rps
  - p95
  - p99
  - latência
  - throughput
  - regressão de performance
  - next.js
  - server actions
file_patterns:
  - '**/route.ts'
  - '**/route.tsx'
  - '**/page.tsx'
  - '**/actions.ts'
  - '**/middleware.ts'
confidence: 0.9
---

# Teste de carga com k6 (Next.js / App Router)

Mede quanta carga a aplicação aguenta **de verdade**, em runtime — throughput
(req/s), latência por percentil (p50/p95/p99), taxa de erro e o ponto em que a
stack degrada. Complementa a análise estática de performance: aquela lê o código,
esta mede o comportamento.

Fluxo: **configurar (1ª vez) → subir a stack → rodar o cenário → relatório →
comparar com o baseline → aprovar ou reprovar**.

> Irmã desta skill: [`load-testing-geral`](../load-testing-geral/SKILL.md), a
> versão para projetos Django (Locust). Mesma filosofia, ferramentas trocadas
> pelo equivalente idiomático de cada stack: k6 no lugar de Locust (Locust é
> Python/WSGI-first; k6 é a ferramenta de load test padrão do ecossistema
> Node/JS, script em JS, sem GIL, um binário só), `next start` no lugar de
> `runserver`/Gunicorn, seed via ORM do projeto (Prisma, Drizzle, o que for) no
> lugar do Django ORM, cookie de sessão do provider de auth do projeto
> (NextAuth, Clerk, custom) no lugar de login+CSRF do Django.

## O que é genérico e o que é do projeto

Esta skill não contém nada de um projeto específico. Três arquivos começam
**vazios/em branco** e precisam ser preenchidos uma vez por projeto:

| Arquivo | Estado inicial | Quem preenche |
| --- | --- | --- |
| `scripts/loadtest.js` | vazio (só um comentário) | agente `load-test-runner-nextjs` |
| `scripts/seed-load-test-users.ts` | hooks vazios, `SEED_CONFIGURED = false` | agente |
| `scripts/loadtest.env` | tudo comentado, `LOADTEST_ENV_CONFIGURED=0` | agente |

`node scripts/check-setup.mjs` diz o que falta (exit 0 = pronto). O
`run-load-test.sh` roda essa checagem e aborta com exit code **3** se algo
estiver pendente — não existe run "verde" sobre um script k6 vazio.

> Para configurar: acione o agente **`load-test-runner-nextjs`**. Manualmente,
> siga `references/discovery-checklist.md` e `references/loadtest-script-template.md`.

## Quando usar / não usar

Usar: depois de criar/alterar feature no ciclo de request (páginas, route
handlers, Server Actions, middleware, queries); antes de deploy sensível; ao
investigar lentidão que só aparece sob concorrência; para criar/atualizar o
**baseline**.

Não usar: para achar N+1 sem rodar nada (auditoria estática); para medir
complexidade de código (veja a skill `cyclomatic-complexity` ou equivalente de
lint); contra **produção real com usuários** sem autorização explícita.

## Pré-requisitos

| Requisito | Como obter |
| --- | --- |
| Docker + Compose v2 | `docker --version && docker compose version` |
| k6 | `k6 version` (binário standalone, sem sudo: baixe o tarball da [release](https://github.com/grafana/k6/releases) e extraia pra `~/.local/bin`) ou `brew install k6` |
| Node no PATH | `node --version` (o projeto já precisa disso para rodar) |
| Um jeito de subir o app em produção | `npm run build && npm start` (ou `pnpm`/`yarn` equivalente) do próprio projeto |
| Um banco de teste isolado | Docker Compose local (recomendado) — **nunca** o `DATABASE_URL` do `.env` do projeto |

> **Nunca** rode carga contra produção sem autorização explícita. O alvo padrão
> é a stack local `http://localhost:<porta>`.

## Arquivos

```
.claude/skills/load-testing-nextjs/
├── SKILL.md
├── scripts/
│   ├── loadtest.js                    ← VAZIO: cenários do projeto (k6)
│   ├── seed-load-test-users.ts        ← genérico + hooks do projeto
│   ├── loadtest.env                   ← env da stack de teste (banco, chaves fake…)
│   ├── check-setup.mjs                ← o que falta configurar?
│   ├── list-routes.mjs                ← lista as rotas do projeto (varre app/)
│   ├── run-load-test.sh               ← orquestrador ponta a ponta
│   ├── analyze-results.mjs            ← summary do k6 → relatório MD + gate
│   └── docker-compose.loadtest.yml    ← db (+redis) de teste
├── references/
│   ├── discovery-checklist.md         ← o que levantar do projeto
│   ├── loadtest-script-template.md    ← esqueleto do script k6
│   ├── k6-patterns.md                 ← como adicionar cenários/checks
│   └── thresholds.md                  ← SLOs e critérios de aprovação
├── baselines/                         ← baselines (JSON), um por cenário
└── reports/                           ← saída de cada execução (gitignored)
```

## Passo a passo

### Passo 0 — Configurar (só na primeira vez, ou quando o projeto mudar)

```bash
node .claude/skills/load-testing-nextjs/scripts/check-setup.mjs
```

Pendente → siga `references/discovery-checklist.md` e preencha os três arquivos
da tabela acima. Dois cuidados que valem para qualquer projeto:

- O **seed** precisa fazer o usuário de teste passar pelo gate de acesso do app
  (assinatura, e-mail verificado, onboarding, consentimento…) e **abortar** se
  não passar. Senão o teste mede o redirect do middleware, não a página.
- O `loadtest.env` usa valores **placeholder**. O `.env` do projeto NÃO é
  carregado de propósito: ele pode ter a URL do banco de produção e chaves de
  serviços pagos (foi exatamente o que aconteceu na primeira execução manual
  desta skill neste projeto — ver "Armadilhas").

### Passo 1 — Definir o escopo

1. **O que mudou?** Rotas/actions tocadas (`git diff --name-only <branch-principal>...HEAD`).
2. **Qual cenário?** `smoke`, `baseline`, `stress`, `spike` ou `soak`.
3. **O script cobre essas rotas?** Senão, adicione um cenário/check
   (`references/k6-patterns.md`).

### Passo 2 — Rodar

O jeito curto (build, seed, run, relatório e gate):

```bash
cd .claude/skills/load-testing-nextjs/scripts
./run-load-test.sh --scenario baseline
```

```bash
./run-load-test.sh --scenario smoke                  # 10 VUs / 1 min
./run-load-test.sh --scenario baseline               # 50 VUs / 5 min — padrão
./run-load-test.sh --scenario stress                 # 300 VUs / 10 min — busca o teto
./run-load-test.sh --scenario spike                  # pico de 200 VUs
./run-load-test.sh --vus 120 --run-time 3m
./run-load-test.sh --host http://localhost:3000 --no-server   # alvo já no ar
./run-load-test.sh --tags minha_feature              # só a feature
./run-load-test.sh --dev                             # usa `next dev` (piso, não capacidade — ver Armadilhas)
./run-load-test.sh --update-baseline                 # promove o resultado a baseline
```

Por baixo: sobe `db` (Postgres, +`redis` se `--with-redis`), espera `healthy`,
roda as migrations do projeto, semeia os usuários dentro do processo Node,
builda e sobe o app (`npm run build && npm start`, ou `next dev` com `--dev`),
roda o k6 headless, gera o relatório e derruba a stack (`--keep-up` mantém).

### Passo 3 — Interpretar

Leia `references/thresholds.md`. Resumo do gate:

| Critério | Aprovado | Atenção | Reprovado |
| --- | --- | --- | --- |
| Taxa de erro | < 0,5% | 0,5–1% | > 1% |
| p95 agregado | ≤ 800 ms | 800–1500 ms | > 1500 ms |
| p99 agregado | ≤ 1500 ms | 1500–3000 ms | > 3000 ms |
| Regressão de p95 vs baseline | ≤ +10% | +10–25% | > +25% |
| Queda de RPS vs baseline | ≤ 10% | 10–20% | > 20% |

Qualquer rota/action individual com p99 > 3 s ou erro > 1% também reprova,
mesmo que o agregado passe.

### Passo 4 — Baseline (só quando fizer sentido)

Promova quando o resultado for **aprovado** e representar o novo estado
esperado. Nunca promova um run reprovado para "fazer o gate passar". Para o
primeiro baseline, rode 3× com a máquina ociosa (ver `thresholds.md`).

## Cenários

| Cenário | VUs | Duração | Para quê |
| --- | --- | --- | --- |
| `smoke` | 10 | 1 min | O cenário roda? Rota nova responde? |
| `baseline` | 50 | 5 min | Medida oficial, comparável entre runs |
| `stress` | 300 | 10 min | Onde quebra, qual o teto de RPS |
| `spike` | 200 (pico súbito) | 3 min | Comportamento em pico |
| `soak` | 30 | 30 min | Vazamento de memória/conexão |

## Checklist antes de reportar

- [ ] `check-setup.mjs` retornou PRONTO.
- [ ] A stack subiu com `next start` (produção) — **ou** explicitamente com
      `--dev`, e o relatório deixa isso claro (dev mode não representa
      capacidade real: sem otimizações de build, HMR ligado, single-thread
      efetivo).
- [ ] Os usuários de teste passam pelo gate de acesso do middleware (senão
      mede-se o redirect).
- [ ] Rodou ≥ 1 min **após** o ramp-up.
- [ ] As rotas da feature aparecem no summary do k6 com contagem > 0.
- [ ] O baseline comparado é do mesmo cenário, config de servidor e host.
- [ ] A taxa de erro foi investigada (3xx de redirect esperado ≠ 5xx real;
      erro do script k6 ≠ erro da aplicação).

## Armadilhas (valem para qualquer projeto Next.js)

- **`next dev` não lê os mesmos arquivos de env que `next build`/`next start`.**
  `.env.production.local` só vale para build/start; para `next dev` use
  `.env.development.local` ou `.env.local` (este último vale para os dois).
  Isso já causou um incidente real rodando esta skill manualmente pela
  primeira vez: o `next dev` de teste subiu apontando pro `DATABASE_URL` de
  **produção** do `.env`, porque o override tinha sido escrito só em
  `.env.production.local`. **Sempre confira a linha `- Environments: ...` que
  o Next imprime no boot** antes de disparar qualquer carga.
- **Gate de acesso**: usuário sem a condição do middleware (status da conta,
  papel, consentimento, assinatura…) é redirecionado e o teste mede o
  middleware. O seed resolve e se autoverifica.
- **Sessão via cookie**: se o provider de auth usa sessão em banco (ex.:
  NextAuth `session: { strategy: "database" }` com adapter Prisma), o seed
  pode criar a `Session` direto no banco de teste e o k6 só manda o cookie —
  não precisa simular o fluxo de login/OAuth inteiro. Se a sessão é JWT
  assinada, o seed precisa assinar um token válido com o mesmo segredo do
  `loadtest.env`.
- **Server Actions não são REST comuns.** São POST para a **URL da própria
  página** com o header `Next-Action: <id-da-action>` e corpo em um formato
  binário específico do React (Flight). Chamar via `<form action={fn}>` normal
  do navegador funciona sem esse header (progressive enhancement); prefira
  testar o formulário como o navegador o envia. Para chamar a action
  diretamente do k6 sem o formulário, é preciso descobrir o id gerado no
  build (varia a cada build) — geralmente **não vale o custo**: teste a rota
  de página que contém a action via submit de formulário real, não a action
  isolada.
- **`export const dynamic = 'force-static'`** em route handlers faz a resposta
  ser cacheada e não medir o backend de verdade — confira `references/discovery-checklist.md`.
- **Lista de ids vazia** faz o cenário retornar sem emitir request de verdade:
  run "verde" sem medir nada. Semeie dados (posts, itens, registros) reais.
- **Rotas com efeito colateral ou custo** (LLM, e-mail, cobrança, upload,
  webhook) ficam **fora do padrão**: tag `expensive` **e** guard
  `if (!ALLOW_EXPENSIVE) return;` no corpo do cenário. A tag sozinha não
  impede nada.
- **`next build` já quebrado antes do teste** invalida tudo: rode
  `npm run build` primeiro e trate qualquer erro de build como bloqueante,
  não como "vou testar em dev mesmo". (Isso aconteceu neste projeto: um
  route handler importando `react-dom/server` quebrava o build por causa da
  condição `"react-server"` do bundler — corrigido antes de qualquer medição
  valer alguma coisa.)
- **`next start`/`next dev` pode deixar um `next-server` órfão no processo
  filho**, mesmo depois de matar o PID que o `run-load-test.sh` capturou (não
  é sempre filho direto no mesmo processo). Aconteceu nesta validação: o PID
  morreu, mas a porta continuou ocupada por um `next-server` vivo até a
  próxima sessão descobrir com `fuser`/`ss -tlnp`. O `cleanup()` do script já
  chama `fuser -k "$APP_PORT/tcp"` como garantia extra — se copiar esse
  padrão pra outro orquestrador, não confie só no PID.
- **Config do servidor** (modo standalone vs `next start` normal, quantidade
  de workers/instâncias, alvo atrás de proxy) e ambiente diferentes invalidam
  a comparação com o baseline; registre no relatório (`LOADTEST_SERVER_CONFIG`).
- **`.env` do projeto não é carregado** — evita escrever no banco de produção e
  gastar com serviços pagos (R2/S3, e-mail, SMS, LLM).
- **Prerendering/cache do App Router**: uma rota que virou totalmente estática
  (prerenderizada) no build mede o servidor de estáticos, não o caminho
  dinâmico que você quer validar. Confirme com `next build` output (`○`
  estático vs `ƒ` dinâmico) o que está sendo testado.

## Referências

- `references/discovery-checklist.md` — o que levantar do projeto.
- `references/loadtest-script-template.md` — esqueleto para escrever o script k6.
- `references/k6-patterns.md` — como adicionar cenários para uma feature nova.
- `references/thresholds.md` — SLOs, critérios de aprovação, calibração.
