@AGENTS.md

# Comunidade Belle et Belle

> 📖 Documentação completa em [`docs/index.md`](docs/index.md) — arquitetura, banco de dados e uma página por feature.

## O que é este projeto

A Comunidade Belle et Belle é o aplicativo web de uma comunidade fechada de acompanhamento fitness/estética, administrada por Patrícia Almeida (Belle et Belle). Clientes se cadastram (login Google), aguardam aprovação manual, e depois têm acesso a: um feed social, desafios mensais gamificados com pontos/ranking/emblemas, registro de medidas corporais, um pacote de sessões contratado (personal trainer/estúdio) com controle de quantas sessões já foram realizadas, e parcerias com profissionais (nutricionista, personal trainer) que acompanham suas medidas e enviam planos em PDF. A gestora (Patrícia e equipe) administra tudo isso por um painel próprio.

## Stack

| Camada | Tecnologia | Fonte que confirma |
| --- | --- | --- |
| Framework | Next.js 16.3.0 (App Router) | `package.json` |
| UI | React 19.2.8 + Tailwind CSS v4 + shadcn/ui (`@base-ui/react`, `class-variance-authority`) | `package.json` |
| ORM | Prisma ^7.9.1, client gerado em `src/generated/prisma` | `prisma/schema.prisma:3-6`, `package.json` |
| Driver do banco | `@prisma/adapter-pg` (driver adapter, não a engine binária padrão do Prisma) | `src/lib/prisma.ts:1-10` |
| Banco de dados | PostgreSQL via **Neon** (`sslmode=verify-full&channel_binding=require`) | `.env` (`DATABASE_URL`) |
| Storage de arquivos | Cloudflare R2, acessado via **AWS SDK v3** (`@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`), porque R2 é compatível com a API S3 | `src/lib/storage/r2.ts` |
| Autenticação | NextAuth v5 (beta) + `@auth/prisma-adapter`, único provedor **Google**, sessão em **banco** (não JWT) | `src/auth.ts:1-25` |
| Gerenciador de pacotes | npm (`package-lock.json`, scripts do `package.json`) | `package.json` |
| Testes | Vitest ^4, com config separada para testes de integração (banco real) | `vitest.config.mts`, `vitest.integration.config.mts` |
| CI | GitHub Actions: lint, typecheck, testes unitários e de integração, build | `.github/workflows/ci.yml` |

**Deploy**: não há `vercel.json` nem configuração de deploy no repositório — o README ainda traz o boilerplate padrão do `create-next-app` mencionando Vercel, mas isso não está confirmado como a infraestrutura real de produção. Trate essa parte como não documentada até confirmar com o time.

## Comandos

```bash
npm install              # instala dependências (roda `prisma generate` via postinstall)
npm run dev               # sobe o Next em modo dev (usa .env.local)
npm run build              # build de produção
npm start                  # sobe o build de produção

npm run db:generate         # gera o Prisma Client (src/generated/prisma)
npm run db:migrate          # cria/aplica migration em dev (prisma migrate dev)
npm run db:deploy           # aplica migrations existentes sem gerar nova (prisma migrate deploy — usado em CI)

npm run lint                # eslint
npm run typecheck            # next typegen && tsc --noEmit

npm test                     # testes unitários/componente (vitest.config.mts)
npm run test:watch            # idem, em watch mode
npm run test:integration       # sobe Postgres via Docker (docker-compose.test.yml), roda migrations e testes de integração reais
```

## Variáveis de ambiente

O Next.js carrega arquivos `.env*` diferentes dependendo do comando — isso já causou confusão real neste projeto (ver "Armadilhas" em `.claude/skills/load-testing-nextjs/SKILL.md`: um `next dev` de teste chegou a apontar para o banco de **produção** porque a variável só tinha sido sobrescrita no arquivo errado).

| Arquivo | Quando é carregado | Propósito | Nunca faça |
| --- | --- | --- | --- |
| `.env` | `next build` / `next start` (produção) e qualquer script que use `dotenv` diretamente (ex. `prisma.config.ts`) | Contém `DATABASE_URL` (Neon), `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` — as credenciais "de verdade" do ambiente onde o processo roda | Não commitar valores reais (está no `.gitignore`) |
| `.env.local` | `next dev` (e também `next build`/`start`, `.local` sempre tem prioridade) | Neste projeto contém só um `DATABASE_URL` — usado para apontar o dev local para um banco diferente do de `.env`, evitando escrever em produção sem querer durante o desenvolvimento | Não deixar vazio nem apontar sem querer pro banco de produção |
| `.env.test` | Scripts de teste de integração (`scripts/migrate-test-db.mjs` carrega explicitamente) | `DATABASE_URL` do Postgres efêmero subido por `docker-compose.test.yml` (porta 5435) | Não usar para nada além dos testes de integração |
| `.env.test.example` | Nunca carregado automaticamente — é só um exemplo versionado | Mostra o formato esperado de `.env.test` para quem for configurar o projeto pela primeira vez | — |

Variáveis de storage (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`) estão em `.env`, junto das demais, e são lidas em runtime por `src/lib/storage/r2.ts` via `obterVariavelObrigatoria`, que lança erro claro se alguma faltar.

## Arquitetura de alto nível

- **App Router** (`src/app/`) organizado por área de acesso, cada uma com seu próprio `layout.tsx` que já faz o gate de papel (`podeAcessarPainel`/`podeAcessarAreaCliente`/`podeAcessarAreaParceria`) e redireciona para `/` se a pessoa não tiver o papel certo:
  - `cliente/` — área da cliente (medidas, fotos, planos, parcerias, desafios, perfil)
  - `painel/` — área da gestora/admin (aprovações, membros, vínculos, desafios, pacotes)
  - `parceria/` — área do profissional parceiro (planos, medidas das clientes, perfil)
  - `feed/`, `perfil/[clienteId]/`, `login/`, `bem-vinda/`, `aguardando-aprovacao/`, `conta-suspensa/` — telas transversais, fora dessas três áreas
- **`middleware.ts`** roda antes de qualquer página (exceto `/login` e `/api/auth/*`) e decide, com base no `status` da conta e se ela já aceitou o termo de consentimento, se redireciona para `/login`, `/conta-suspensa`, `/aguardando-aprovacao`, `/bem-vinda` ou deixa passar — ver `docs/architecture.md`.
- Cada pasta de feature segue o mesmo padrão de arquivos: `page.tsx` (Server Component, busca dados via `queries.ts`), `actions.ts` (Server Actions, `"use server"`), `queries.ts` (funções de leitura Prisma), e componentes `"use client"` para interações.
- Detalhes completos, diagramas e integrações externas: **`docs/architecture.md`**.

## Features

| Feature | Responsabilidade em uma linha | Doc |
| --- | --- | --- |
| Identidade & acesso | Login (Google/NextAuth), aprovação de conta, papéis (CLIENTE/PARCERIA/GESTORA/ADMIN), consentimento, gates de rota | [`docs/features/identidade-acesso.md`](docs/features/identidade-acesso.md) |
| Desafios | Desafios mensais gamificados: itens diários, bônus, desafios surpresa, comprovação por foto, ranking, emblemas, jornada antes/depois | [`docs/features/desafios.md`](docs/features/desafios.md) |
| Pacotes | Catálogo de tipos de sessão/pacote e o controle de quantas sessões cada cliente já realizou do pacote contratado | [`docs/features/pacotes.md`](docs/features/pacotes.md) |
| Medidas | Registro de medidas corporais da cliente e a visão dessas medidas pela parceria vinculada | [`docs/features/medidas.md`](docs/features/medidas.md) |
| Parcerias | Vínculo cliente↔parceria (criado pela gestora), perfil da parceria, envio de planos de treino/dieta em PDF | [`docs/features/parcerias.md`](docs/features/parcerias.md) |
| Feed | Posts, curtidas, comentários, post fixado ("destaque") no topo | [`docs/features/feed.md`](docs/features/feed.md) |
| Perfil | Perfil público (visível para outras clientes conforme escolhas de privacidade) e autoedição do próprio perfil | [`docs/features/perfil.md`](docs/features/perfil.md) |

## Padrões-chave

Estes padrões se repetem em quase toda Server Action do projeto — vale conhecê-los antes de mexer em qualquer feature.

### `executarAction` / `AppError` (`src/lib/actions/executar-action.ts`)

Toda Server Action envolve seu corpo em `executarAction(async () => { ... })`. Isso garante que:
- Sinais internos do Next (`redirect`, `notFound`) continuem funcionando (`unstable_rethrow`).
- Um `throw new AppError("mensagem amigável")` chega ao client exatamente com essa mensagem — inclusive as validações de upload em `src/lib/storage/*` (formato/tamanho de arquivo), que lançam `AppError` para isso.
- Qualquer outro erro (bug, erro do Prisma, uma variável de ambiente obrigatória ausente) vira a mensagem genérica `"Não foi possível concluir a ação."` no client, e o erro real é logado no servidor com `console.error`.

### `useAcaoComErro` (`src/hooks/use-acao-com-erro.ts`)

Hook client-side usado por quase todo formulário/botão que chama uma Server Action: controla `isPending` (via `useTransition`) e `erro`, exibindo `error.message` na tela quando a action lança — seguro porque toda Server Action já passa por `executarAction`.

### Gates de acesso (`src/lib/auth/`)

- `requererSessao()` — exige qualquer sessão válida, lança `AppError("Acesso negado")` senão.
- `requererPapel(["CLIENTE"])` / `requererPapel(["GESTORA", "ADMIN"])` — exige que a sessão tenha pelo menos um dos papéis informados.
- `requererAcessoPainel()` — atalho para `requererPapel(["GESTORA", "ADMIN"])`, usado em quase toda action de `painel/*`.
- Essas funções (em `src/lib/auth/requerer-acesso-painel.ts`) são para uso **dentro de Server Actions e queries** (lançam erro). As funções booleanas equivalentes para uso em **Server Components/layouts** (que redirecionam em vez de lançar) ficam em `src/lib/auth/pode-acessar-painel.ts`: `podeAcessarPainel`, `podeAcessarAreaCliente`, `podeAcessarAreaParceria`, `podeAcessarDesafiosCliente`.

### Padrão "um ativo por vez"

Três models usam o mesmo padrão — um booleano `ativo`/`destaque` que só pode ser `true` para no máximo um registro por vez dentro de um escopo:

| Model | Campo | Escopo | Onde é garantido |
| --- | --- | --- | --- |
| `Desafio` | `ativo` | Global (só um desafio ativo no sistema todo) | Checagem manual antes de criar/reabrir (`findFirst({ where: { ativo: true }})` + `AppError` se já existir) — **não** é uma constraint de banco, é lógica de aplicação em `src/app/painel/desafios/actions.ts` |
| `CicloPacote` | `ativo` | Por cliente | `$transaction` que primeiro desativa (`arquivadoEm: new Date()`) todos os ciclos ativos da cliente e depois cria o novo, em `src/app/painel/membros/[membroId]/actions.ts:vincularPacote` |
| `Post` | `destaque` | Global (só um post fixado no feed todo) | `$transaction` que zera `destaque` de todos antes de marcar o novo, em `src/app/feed/actions.ts` (`criarPost` e `alternarDestaque`) |

Em nenhum dos três casos existe um índice único parcial no banco garantindo isso — é responsabilidade da lógica de aplicação (transação ou checagem antes de escrever). Ao adicionar um novo caminho de escrita para esses campos, replique o mesmo cuidado.

## Sincronização da documentação

Ao concluir uma mudança que altere o comportamento do sistema (model ou campo do Prisma, migration, rota, Server Action, gate de acesso, módulo de storage, variável de ambiente ou dependência) e antes de commitar, execute o agente `doc-sync-onboarding` para atualizar `CLAUDE.md` e `docs/`. Não execute para ajustes que não mudam comportamento (testes, estilo, textos, refatoração interna).

O repositório é público: nunca registre vulnerabilidades nem proteções ausentes em arquivo versionado.

## Mapa de dependências (graphify, opcional)

Se o `graphify` estiver instalado (`graphify --version`), antes de alterar uma função ou componente usado em vários lugares:

1. Atualize o grafo: `graphify update .` (não usa API).
2. Rode `graphify affected "nome()" --depth 1` para ver quem é impactado e `graphify explain "nome()"` para ver o que ele usa.

Nunca leia `graphify-out/graph.json` diretamente (é grande); use os comandos acima. O grafo cobre chamadas e imports de código. Não cobre tipos, models do Prisma nem testes, e um resultado vazio não prova que nada usa o símbolo. Para tipos e campos do Prisma use `npm run typecheck`, e confirme com `grep -rn` antes de concluir que nada mais o usa.

Ao afirmar que um símbolo não é referenciado fora de `src/`, busque em todos os tipos de arquivo (sem `--include`), porque `docs/`, `specs/` e os agentes citam nomes de função.
