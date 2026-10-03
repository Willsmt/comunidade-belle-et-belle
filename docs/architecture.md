# Arquitetura

> Se você está chegando agora, leia primeiro [`docs/index.md`](./index.md). Este documento cobre como as peças se encaixam; o "o que cada feature faz" está em [`docs/features/`](./features/), e o modelo de dados completo está em [`docs/database.md`](./database.md).

## Visão geral (sem jargão)

O Comunidade Belle et Belle é um site (Next.js) com quatro "áreas" diferentes dependendo de quem está logado: o feed geral (todo mundo), a área da cliente (medidas, desafios, perfil), a área da parceria (nutricionista/personal enviando planos) e o painel de gestão (só administração). Uma única "portaria" (o middleware de autenticação) decide, a cada clique, se a pessoa pode estar onde está tentando ir — se não pode, ela é redirecionada para o lugar certo (login, tela de espera, tela de termo, etc.) sem precisar de nenhuma lógica repetida em cada página.

O banco de dados fica na nuvem (Neon, um Postgres gerenciado), e as fotos/PDFs enviados pelos usuários não ficam no servidor nem no banco — ficam num "depósito" separado (Cloudflare R2), e o site só guarda o endereço de cada arquivo, gerando links temporários e assinados quando precisa mostrar algo.

## Stack

| Camada | Tecnologia | Versão | Onde configurar |
| --- | --- | --- | --- |
| Framework | Next.js (App Router) | `16.3.0` | `next.config.ts` |
| UI | React | `19.2.8` | — |
| ORM | Prisma (`prisma-client` generator) + `@prisma/adapter-pg` | `^7.9.1` | `prisma.config.ts`, `prisma/schema.prisma` |
| Banco | PostgreSQL (Neon, produção) / Postgres 16 via Docker (testes) | — | `DATABASE_URL` |
| Storage de arquivos | Cloudflare R2 (S3-compatible), via `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` | AWS SDK `^3.1106.0` | `src/lib/storage/r2.ts` |
| Autenticação | NextAuth (Auth.js) v5, provider Google, `@auth/prisma-adapter`, sessão em banco | `^5.0.0-beta.32` | `src/auth.ts` |
| Testes | Vitest (unitário) + config separada de integração | `^4.1.10` | `vitest.config.mts`, `vitest.integration.config.mts` |
| Gerenciador de pacotes | npm | — | `package-lock.json` |
| Deploy | Vercel (implícito pelo template padrão do Next.js; sem arquivo de config de outra plataforma no repo) | — | — |

> ⚠️ Este projeto roda em uma versão fork/modificada do Next.js com convenções e APIs que podem divergir do que você conhece — leia `AGENTS.md` na raiz e os guias em `node_modules/next/dist/docs/` antes de mexer em código que dependa de comportamento específico do framework.

## Camadas de acesso (layouts + gates)

```mermaid
flowchart TD
    Root["/ (layout.tsx raiz)<br/>mostra nav só se ATIVO + consentimento"] --> MW[middleware.ts]
    MW -->|sem sessão| Login[/login]
    MW -->|SUSPENSO| Suspensa[/conta-suspensa]
    MW -->|PENDENTE| Aguardando[/aguardando-aprovacao]
    MW -->|ATIVO sem consentimento| BemVinda[/bem-vinda]
    MW -->|liberado| Areas

    subgraph Areas["Áreas protegidas por layout próprio"]
        Feed["/feed<br/>(sem gate de papel, só sessão)"]
        Cliente["/cliente/*<br/>gate: podeAcessarDesafiosCliente<br/>(cliente/layout.tsx)"]
        Parceria["/parceria/*<br/>gate: podeAcessarAreaParceria<br/>(parceria/layout.tsx)"]
        Painel["/painel/*<br/>gate: podeAcessarPainel<br/>(painel/layout.tsx)"]
        Perfil["/perfil/[clienteId]<br/>(sem gate de papel, qualquer sessão)"]
    end
```

Cada layout (`cliente/layout.tsx`, `parceria/layout.tsx`, `painel/layout.tsx`) faz sua própria checagem de papel com `redirect("/")` caso negado — é uma segunda camada de defesa, redundante em relação ao middleware por desenho (o middleware cobre "a conta está numa situação que permite navegar", os layouts cobrem "o papel específico dessa área"). Dentro de cada página/Server Action, gates adicionais (`requererPapel`, `requererAcessoPainel`, `requererSessao`, todos em `src/lib/auth/requerer-acesso-painel.ts`) são a checagem que realmente importa para mutações — nenhuma escrita no banco confia só no layout.

## Fluxo de autenticação e gates

```mermaid
sequenceDiagram
    participant U as Usuário
    participant NA as NextAuth (src/auth.ts)
    participant G as Google OAuth
    participant DB as Postgres (Neon)
    participant MW as middleware.ts

    U->>NA: signIn("google")
    NA->>G: redireciona pro consentimento OAuth
    G-->>NA: callback com perfil do Google
    NA->>DB: PrismaAdapter cria/atualiza User + Account (status PENDENTE se novo)
    NA->>DB: cria Session (strategy "database")
    NA-->>U: cookie de sessão
    U->>MW: qualquer navegação seguinte
    MW->>NA: auth() lê a Session
    NA->>DB: callback session() busca status/papeis/consentimento
    NA-->>MW: session enriquecida (enrichSession)
    MW->>MW: decideRoute(session.user, pathname)
    MW-->>U: next ou redirect
```

Detalhes completos do fluxo de aprovação/consentimento e da árvore de decisão do gate estão em [`docs/features/identidade-acesso.md`](./features/identidade-acesso.md).

## Padrões-chave do código

### `executarAction` / `AppError`

`src/lib/actions/executar-action.ts` é o wrapper padrão de toda Server Action. Regra: **erros intencionais** (mensagem pensada para aparecer na tela) devem ser lançados como `new AppError("mensagem amigável")`; qualquer outro erro (Prisma, rede, bug) é automaticamente mascarado por uma mensagem genérica ("Não foi possível concluir a ação.") e logado no servidor com `console.error`, para nunca vazar detalhe técnico ao usuário final. Sinais internos de controle de fluxo do Next (`redirect`, `notFound`) são relançados via `unstable_rethrow` antes de qualquer tratamento — isso precisa ser a primeira linha do `catch`, por exigência da própria API do Next.

```ts
export async function minhaAction() {
  return executarAction(async () => {
    // ... lógica ...
    if (condicaoInvalida) throw new AppError("Mensagem que o usuário vai ver");
    // qualquer outro throw aqui vira mensagem genérica automaticamente
  });
}
```

### `useAcaoComErro`

`src/hooks/use-acao-com-erro.ts` é o hook client-side companheiro: envolve uma Server Action em `useTransition`, expõe `isPending`/`erro`/`executar`, e mostra `error.message` diretamente na tela. Isso é seguro porque toda Server Action passa por `executarAction`.

### Gates de acesso

`requererPapel(papeis[])`, `requererAcessoPainel()` (atalho para `["GESTORA", "ADMIN"]`) e `requererSessao()` (`src/lib/auth/requerer-acesso-painel.ts`) são as funções que toda Server Action de escrita deve chamar antes de tocar no banco. Todas lançam `AppError("Acesso negado")` em caso de negação — nunca retornam um booleano silencioso.

### Padrão "um ativo por vez"

Repetido em três lugares do domínio — `Desafio.ativo`, `CicloPacote.ativo` e `Post.destaque` — e sempre implementado da mesma forma: **não há constraint de banco** impedindo dois registros ativos simultâneos; a exclusividade é garantida **na aplicação**, dentro de uma `prisma.$transaction([...])` que primeiro desliga o registro atualmente ativo (`updateMany`) e só então liga o novo. Antes de criar um quarto caso desse padrão em qualquer feature nova, replique exatamente essa forma (transação com `updateMany` + `create`/`update`), não um `unique` parcial no schema — o projeto já decidiu não ir por esse caminho.

| Onde | Escopo da exclusividade | Doc da feature |
| --- | --- | --- |
| `Desafio.ativo` | Global (só 1 desafio ativo no sistema todo) | [`docs/features/desafios.md`](./features/desafios.md) |
| `CicloPacote.ativo` | Por cliente (`clienteId`) | [`docs/features/pacotes.md`](./features/pacotes.md) |
| `Post.destaque` | Global | [`docs/features/feed.md`](./features/feed.md) |

## Storage (R2)

```mermaid
sequenceDiagram
    participant Page as Server Action/Component
    participant Obj as src/lib/storage/objetos.ts
    participant R2C as src/lib/storage/r2.ts
    participant R2 as Cloudflare R2

    Page->>Obj: uploadObjeto(chave, buffer, contentType)
    Obj->>R2C: obterR2Client() (S3Client, endpoint *.r2.cloudflarestorage.com)
    Obj->>R2: PutObjectCommand
    Note over Page,R2: o banco só guarda a "chave" (o caminho), nunca o arquivo

    Page->>Obj: gerarUrlAssinada(chave)
    Obj->>R2: getSignedUrl(GetObjectCommand, expiresIn: 300s)
    R2-->>Page: URL temporária (expira em 5 minutos)
```

Cada feature que lida com arquivos tem seu próprio módulo fino em `src/lib/storage/` (ex.: `fotos.ts`, `perfil.ts`, `planos.ts`, `posts.ts`, `comprovantes-*.ts`, `jornada-desafio.ts`) — todos delegam para as três funções genéricas de `objetos.ts` (`uploadObjeto`, `gerarUrlAssinada`, `deletarObjeto`), e cada um decide suas próprias regras de validação (tipo de arquivo, tamanho máximo, compressão). A validação real de formato é feita lendo os bytes do arquivo (magic bytes, via `sharp`), não confiando no `Content-Type` declarado pelo client — decisão de segurança documentada no próprio código de `comprimir-imagem.ts`.

Exclusão de arquivo é sempre real (`DeleteObjectCommand`), nunca uma flag de "apagado" no banco — condizente com a promessa de exclusão de dados feita no termo de consentimento (ver [`docs/features/identidade-acesso.md`](./features/identidade-acesso.md)).

### Exibindo imagens sensíveis: `ImagemSensivel`

**Em linguagem simples:** a foto de uma cliente só pode ser vista por quem recebeu o "link temporário" dela, e esse link vence em poucos minutos. Para que esse prazo valha de verdade, fotos do corpo e comprovantes são entregues ao navegador **direto do R2**, sem passar pela "copiadora" de imagens do Next (o otimizador `/_next/image`, que redimensiona e guarda cópias por horas).

**Detalhe técnico:** `src/components/imagem-sensivel.tsx` é um wrapper fino de `next/image` que sempre passa `unoptimized` — a prop vem **depois** do spread de props, então quem usa o componente não consegue sobrescrevê-la. Com isso, o `<img>` renderizado aponta para a signed URL do R2 (expira em 300s) em vez de `/_next/image?url=...`.

| Onde é usado | Imagem |
| --- | --- |
| `src/app/cliente/fotos/item-foto.tsx` | Fotos de evolução da própria cliente |
| `src/app/perfil/[clienteId]/page.tsx` | Galeria de fotos de evolução públicas e imagem de post com `fotoEvolucaoId` |
| `src/app/feed/cartao-post.tsx` | Imagem do post **só quando** `post.fotoEvolucaoId` está preenchido (upload comum do post continua com `next/image` otimizado) |
| `src/app/feed/novo/formulario-novo-post.tsx` | Miniaturas do seletor de foto de evolução |
| `src/app/cliente/desafios/fotos-jornada.tsx` | Fotos de "antes" e "depois" da jornada do desafio |
| `src/app/painel/aprovacoes/page.tsx` | Fotos de comprovação de item e de desafio surpresa |
| `src/app/painel/desafios/[desafioId]/page.tsx` | Fotos de comprovação de desafio surpresa |

**Regra para código novo:** qualquer tela que exiba foto corporal, foto de evolução ou comprovante (imagem vinda de `src/lib/storage/fotos.ts`, `jornada-desafio.ts` ou `comprovantes-*.ts`) deve usar `ImagemSensivel`, não `next/image` direto. Imagens não sensíveis (foto de perfil, upload próprio de post, emblemas) continuam com `next/image` normal. Observação: em dev, `next.config.ts` já desliga a otimização para todas as imagens (`images.unoptimized` fora de produção, por causa do problema do `sharp` no WSL2), então a diferença entre os dois componentes só aparece em build de produção.

## Configuração por ambiente

| Arquivo | Quando é lido | Propósito |
| --- | --- | --- |
| `.env` | `next build` / `next start` (produção) e por padrão em qualquer ambiente que não sobrescreva | `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` — credenciais do ambiente onde o processo roda |
| `.env.local` | `next dev` **e** `next start`, tem prioridade sobre `.env` em ambos | Hoje só sobrescreve `DATABASE_URL` — é o mecanismo pra apontar o `next dev` local para um banco de desenvolvimento, **evitando que o dev local escreva no Neon de produção** |
| `.env.test` | Carregado manualmente por `scripts/migrate-test-db.mjs` (via `dotenv`) antes de `prisma migrate deploy`, e pelos testes de integração (`vitest.integration.setup.ts`) | `DATABASE_URL` apontando para o Postgres local do `docker-compose.test.yml` (porta `5435`) |
| `.env.test.example` | Nunca carregado — é só um exemplo versionado | Mostra o formato esperado de `.env.test` para quem configura o projeto pela primeira vez |

**Isso já causou confusão real neste projeto**: o Next.js tem uma ordem de precedência de arquivos de env diferente entre `next dev` e `next build`/`next start` (`.env.production.local` só vale para build/start; `next dev` usa `.env.development.local` ou `.env.local`). Um incidente documentado na skill de load-testing (`.claude/skills/load-testing-nextjs/SKILL.md`, seção "Armadilhas") registra que rodar `next dev` localmente acabou apontando para o `DATABASE_URL` de **produção** do `.env`, porque o override só existia em `.env.production.local`. **Sempre confira a linha `- Environments: ...` que o Next imprime no boot** antes de rodar qualquer coisa que escreva no banco.

Detalhe de uso de cada variável de storage (todas em `.env`, lidas via `process.env` onde quer que ele resolva, incluindo variáveis de ambiente da plataforma de deploy em produção):

| Variável | Uso |
| --- | --- |
| `R2_ACCOUNT_ID` | Monta o endpoint `https://<accountId>.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Credenciais do client S3 apontando pro R2 |
| `R2_BUCKET_NAME` | Nome do bucket; também usado em `next.config.ts` para montar o `remotePatterns` de `next/image` |

## CI

`.github/workflows/ci.yml` roda em todo push para `main` e em pull requests: sobe um Postgres 16 de serviço, `npm ci`, `prisma generate`, `prisma migrate deploy`, lint, typecheck, `vitest run` (unitário), `vitest run --config vitest.integration.config.mts` (integração) e por fim `next build`. Não há step de deploy nesse workflow — o deploy é presumivelmente feito pela integração nativa da Vercel com o repositório Git (não há configuração de outra pipeline de deploy no repo).

## Agentes e skills do Claude Code (`.claude/`)

O `.gitignore` ignora o conteúdo de `.claude/` por padrão, com duas exceções explícitas que **são** versionadas: `.claude/agents/` e `.claude/skills/`.

- **`.claude/agents/`** (versionado): `doc-sync-onboarding.md` (mantém esta documentação sincronizada com o código) e `load-test-runner-nextjs.md` (executa a skill de teste de carga abaixo).
- **`.claude/skills/`** (versionado, com duas exceções): `speckit-*` (fluxo de spec-kit usado em `specs/`), `cyclomatic-complexity` e `load-testing-nextjs`. As exceções, re-ignoradas por regras específicas do `.gitignore`: `.claude/skills/prisma-*` são symlinks locais para `.agents/` (pasta ignorada, gerada pelo `prisma init` em cada máquina) e `.claude/skills/load-testing-geral/` (equivalente da skill de load test para projetos Django, não usada neste projeto Next.js) não é versionada.
