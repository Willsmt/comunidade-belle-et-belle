# Checklist de descoberta (preencher a skill pela primeira vez)

Leia o código — nunca suponha. Ordem sugerida:

## 1. Rotas

```bash
node .claude/skills/load-testing-nextjs/scripts/list-routes.mjs
```

Isso lista páginas e route handlers a partir da árvore `app/`. Não aparecem
aqui (leia à parte):

- **`middleware.ts`** — qual o gate de acesso? Que status/papel/condição libera
  cada grupo de rotas? Isso é o que o seed precisa satisfazer.
- **Server Actions** (`"use server"` no topo do arquivo, ou função marcada
  dentro de um Server Component) — que formulário/página as invoca? Qual
  papel/sessão exigem?
- **Rotas dinâmicas** (`[id]`, `[...slug]`) — que IDs existem de verdade no
  banco de teste? Nunca invente um ID; puxe da mesma seed que você escreve.

## 2. Autenticação / sessão

- Qual provider? (NextAuth/Auth.js, Clerk, Lucia, custom JWT em cookie…)
- Estratégia de sessão: **banco** (adapter cria linha em `Session`, você pode
  inserir direto) ou **JWT assinado** (você precisa assinar um token válido
  com o mesmo segredo do `loadtest.env`)?
- Nome do cookie de sessão e se é `httpOnly`/`secure` (em `http://localhost`
  normalmente `secure` fica desligado — confirme, já que muda o nome do
  cookie em alguns providers, ex. `authjs.session-token` vs
  `__Secure-authjs.session-token`).
- O gate do middleware olha só a sessão, ou também papel/status/assinatura
  guardados em outra tabela? Onde isso é lido (uma query a mais no meio do
  request = custo real a medir também).

## 3. Banco de dados / ORM

- Prisma, Drizzle, Kysely, SQL cru?
- Comando de migration do projeto (vai para `LOADTEST_MIGRATE_COMMAND` no
  `loadtest.env`).
- O projeto já tem uma stack de teste isolada (ex. `docker-compose.test.yml`
  para os testes de integração)? Reaproveite a porta/config em vez de duplicar.

## 4. Variáveis de ambiente

- Quais são exigidas pra app subir sem crashar (`AUTH_SECRET`, chaves de OAuth,
  URLs de serviço)? Placeholder resolve para tudo que não é exercitado pelas
  rotas testadas (upload real pra S3, envio de e-mail, chamada a LLM…).
- **Confirme como o Next carrega env em cada modo**: `next dev` lê
  `.env.development.local` → `.env.local` → `.env.development` → `.env`;
  `next build`/`next start` (produção) lê `.env.production.local` →
  `.env.local` → `.env.production` → `.env`. **Nenhum dos dois lê
  `.env.production.local` durante `next dev`** — se você escrever o override
  no arquivo errado, o app sobe apontando pro banco/segredos reais do `.env`
  sem avisar. O `run-load-test.sh` desta skill evita esse problema exportando
  as variáveis direto no ambiente do processo (`source loadtest.env`) em vez
  de escrever um arquivo `.env*` — variáveis de processo sempre vencem
  qualquer `.env*` que o Next carregue por baixo.

## 5. Rotas caras/com efeito colateral

Liste rotas/actions que chamam LLM, disparam e-mail/SMS, cobram cartão, sobem
arquivo pra storage externo, chamam webhook. Essas ficam fora do cenário
padrão (tag `expensive`, guard `ALLOW_EXPENSIVE`).

## 6. Config de servidor

- `next.config.ts`: `output: "standalone"`? Redirects/rewrites que afetam a
  rota testada? `images.domains` (irrelevante pra k6, mas pode custar tempo se
  a página faz otimização de imagem on-demand)?
- Quantas instâncias/workers roda em produção de verdade? Isso vai no
  `LOADTEST_SERVER_CONFIG` do `loadtest.env`, só para constar no relatório —
  `next start` local é 1 processo Node, não é comparável 1:1 com um deploy
  multi-instância atrás de load balancer.

## 7. Depois de levantar tudo isso

Preencha, nesta ordem, e valide com `check-setup.mjs` entre cada um:

1. `scripts/loadtest.env` (banco de teste, comando de migration, placeholders).
2. `scripts/seed-load-test-users.ts` (`grantAccess`/`hasAccess`/`seedData`).
3. `scripts/loadtest.js` (ver `loadtest-script-template.md`).
