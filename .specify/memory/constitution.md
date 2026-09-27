<!--
Sync Impact Report
- Version change: [template] → 1.0.0 (initial ratification)
- Modified principles: n/a (first real content; all placeholders replaced)
- Added sections:
  - Core Principles: I. Ciclo de Desenvolvimento Guiado por Teste (NÃO NEGOCIÁVEL)
  - Core Principles: II. Reaproveitamento de Padrões Existentes
  - Core Principles: III. Decisões de Arquitetura e Segurança Compartilhadas
  - Core Principles: IV. Disciplina de Escopo Local
  - Stack Técnica
  - Fluxo de Trabalho e Commits
  - Governance
- Removed sections: Principle V slot (template offered 5; only 4 principles were
  specified for this project, so the fifth slot was dropped rather than filled
  with filler content)
- Deferred items / TODOs: none
- Templates requiring follow-up: none checked in this run (plan/spec/tasks
  templates read this constitution at runtime; no edits made to them here per
  scope guard)
-->

# Comunidade Belle et Belle Constitution

## Core Principles

### I. Ciclo de Desenvolvimento Guiado por Teste (NÃO NEGOCIÁVEL)
Toda mudança que envolva dados ou comportamento do sistema MUST seguir a ordem:
model → migration → serializer → view/permissão → TESTES → commit. Cada camada
só avança depois que a anterior está coerente com o schema/Prisma.

Uma tarefa MUST NOT ser considerada concluída sem a saída real de uma execução
de teste (`npm run test` e, quando a mudança tocar banco/storage, `npm run
test:integration`) mostrando passagem — uma afirmação de que "deveria passar"
não substitui a execução. Se um teste não pôde ser executado (ambiente
indisponível, etc.), isso MUST ser reportado explicitamente como pendência, não
omitido.

**Rationale**: seguir a ordem model→...→permissão captura primeiro erros de
forma de dados e só depois erros de autorização, evitando que uma permissão
pareça "certa" sobre um modelo ainda errado. Exigir output real de teste evita
o erro comum de declarar sucesso sem verificação.

### II. Reaproveitamento de Padrões Existentes
Antes de criar uma nova abstração para um problema já resolvido no projeto,
MUST verificar e reutilizar o padrão existente — por exemplo: storage de
objetos genérico em `src/lib/storage/objetos.ts`, o hook `use-acao-com-erro.ts`
para ações com tratamento de erro, e o gate de papel `pode-acessar-painel.ts`
para controle de acesso ao painel. Criar uma alternativa paralela para o mesmo
propósito requer justificativa explícita registrada na tarefa/PR.

**Rationale**: o projeto já paga o custo de manter esses padrões; duplicá-los
fragmenta comportamento (ex.: dois caminhos de autorização) e aumenta a
superfície de bugs de segurança e inconsistência de UX.

### III. Decisões de Arquitetura e Segurança Compartilhadas
Nenhuma decisão de arquitetura ou segurança que mude o comportamento do
sistema (novas dependências, fluxos de autenticação/autorização, mudanças no
modelo de dados com implicação de segurança, escolhas de storage/infra,
contratos de API) MUST ser tomada unilateralmente pelo agente. Nesses casos, o
agente MUST apresentar as opções viáveis com seus trade-offs e aguardar a
escolha do responsável antes de implementar.

**Rationale**: essas decisões têm custo de reversão alto e efeito sobre
segurança/dados de usuários reais da comunidade; a decisão final é humana.

### IV. Disciplina de Escopo Local
Mudanças MUST se manter dentro do escopo da tarefa em andamento. Refatorar
arquivos ou lógica fora desse escopo — mesmo que a oportunidade seja notada
durante o trabalho — MUST NOT ser feito na mesma tarefa; a oportunidade MUST
ser registrada separadamente (ex.: comentário na PR ou nova tarefa) em vez de
ser resolvida "de brinde".

**Rationale**: escopo expandido dificulta review, mistura intenções em um
único commit/PR e aumenta o risco de regressão em código não relacionado ao
pedido original.

## Stack Técnica

Next.js (App Router) com TypeScript; Prisma como ORM contra Postgres (Neon);
armazenamento de objetos via Cloudflare R2 através do wrapper genérico em
`src/lib/storage/objetos.ts`. Testes unitários/de componente com Vitest e
Testing Library (`npm run test`); testes de integração com banco real via
`npm run test:integration` (usa `vitest.integration.config.mts` e o script de
migração de banco de teste).

## Fluxo de Trabalho e Commits

Commits MUST seguir Conventional Commits (`tipo(escopo): descrição`, ex.:
`fix(auth): ...`, `feat(feed): ...`). Commits gerados neste projeto MUST NOT
incluir trailer `Co-Authored-By`.

O ciclo de uma tarefa é: model → migration → serializer → view/permissão →
TESTES → commit (Princípio I). Decisões de arquitetura/segurança que surgirem
durante esse ciclo seguem o Princípio III antes de qualquer implementação.

## Governance

Esta constituição tem precedência sobre convenções informais e preferências
individuais de estilo. Emendas exigem: (1) descrição da mudança e motivo, (2)
atualização deste arquivo com o Sync Impact Report no topo, (3) incremento de
versão por semver — MAJOR para remoção/redefinição incompatível de princípio,
MINOR para princípio novo ou expansão material, PATCH para redação/clareza.

Toda tarefa concluída via este fluxo (Spec Kit) MUST ser verificada quanto à
conformidade com os Princípios I–IV antes de ser reportada como pronta. Para
orientação adicional específica de execução (não de governança), ver
`AGENTS.md` na raiz do projeto.

**Version**: 1.0.0 | **Ratified**: 2026-09-26 | **Last Amended**: 2026-09-26
