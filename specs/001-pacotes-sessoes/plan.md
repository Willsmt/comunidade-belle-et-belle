# Implementation Plan: Pacotes de Sessões

**Branch**: `001-pacotes-sessoes` | **Date**: 2026-09-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-pacotes-sessoes/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Sistema de pacotes de sessões: a Patty cadastra tipos de sessão e tipos de
pacote (nome + lista de tipos de sessão com quantidade) num catálogo próprio,
vincula um tipo de pacote a uma cliente (abrindo um ciclo ativo, com
confirmação explícita — mostrando o estado atual — quando isso for substituir
um ciclo já ativo), marca sessões realizadas por tipo (contador X/Y calculado,
com bloqueio ao atingir Y e opção de desfazer), renova o pacote (mesma operação
de vincular; novo ciclo ativo, ciclo anterior arquivado como histórico — mesmo
mecanismo de "um ativo por vez" já usado em Desafios) e consulta o histórico
completo de sessões realizadas, incluindo ciclos arquivados. Abordagem técnica:
6 novas tabelas no Prisma existente (`TipoSessao` e `TipoPacote` como
catálogos cadastráveis pelo painel, sem enum), reaproveitando os padrões já
estabelecidos no projeto (gate de painel, hook de ação com erro,
queries/actions por pasta de rota, contador calculado por `count` em vez de
denormalizado, confirmação via `BotaoComConfirmacao`).

> **Revisão pós-plano inicial**: duas decisões de design foram corrigidas pelo
> usuário antes da geração de `tasks.md` — `TipoSessao` deixou de ser enum e
> passou a ser catálogo cadastrável (FK em vez de enum em `ItemTipoPacote`,
> `ItemCicloPacote` e `SessaoRealizada`), e a substituição de um ciclo ativo
> (FR-004/FR-009) passou a exigir confirmação explícita mostrando o contador
> atual (FR-014, nova). Ver research.md para o detalhamento de cada decisão.

## Technical Context

**Language/Version**: TypeScript, Next.js (App Router) — mesma versão já usada no repositório (ver `package.json`)

**Primary Dependencies**: Prisma (`@prisma/client`, adapter Postgres), NextAuth (`auth()` já existente para sessão/papéis) — nenhuma dependência nova

**Storage**: PostgreSQL (Neon) via Prisma — sem uso de storage de objetos (R2) nesta feature; não há upload de arquivo em nenhum dos requisitos

**Testing**: Vitest + Testing Library para unit/component (`npm run test`, Prisma mockado); Vitest com config separada para integração contra banco real (`npm run test:integration`, `vitest.integration.config.mts`) — ambos exigidos pelo Princípio I da constituição antes de considerar qualquer tarefa concluída

**Target Platform**: Web (navegador), aplicação Next.js já em produção — sem plataforma nova

**Project Type**: Aplicação web monolítica Next.js já existente (não é "single project" nem "web app" genérico do template — é uma extensão do app atual em `src/app`, `src/lib`, `src/hooks`)

**Performance Goals**: Sem meta especial — mesmo padrão das demais telas do painel (poucas dezenas de registros por consulta, sem paginação hoje)

**Constraints**: Nenhuma restrição de performance/offline específica; deve respeitar o gate de acesso ao painel (Princípio II/FR-012) e não pode alterar comportamento de Desafios ou de outras áreas (Princípio IV — escopo local)

**Scale/Scope**: Comunidade de uma esthetics studio (dezenas a poucas centenas de clientes ativas; poucos tipos de pacote cadastrados) — mesma ordem de grandeza das demais tabelas já existentes no schema

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|---|---|
| I. Ciclo Guiado por Teste | Plano segue model (Prisma) → migration → serializer (`queries.ts`) → view/permissão (`actions.ts` com `requererAcessoPainel` + páginas) → testes → commit, como já mapeado em `tasks.md` (a ser gerado por `/speckit-tasks`). **PASS** (verificação real de execução de teste acontece na fase de implementação, não neste plano). |
| II. Reaproveitamento de Padrões | Reaproveita `requererAcessoPainel()`, `useAcaoComErro`, estilo `queries.ts`/`actions.ts`/`executarAction`, padrão de contador calculado (`conquistas.ts`), padrão de "um ativo por vez" (`Desafio.ativo`) e `BotaoComConfirmacao` para a confirmação de FR-014. Nenhuma abstração nova paralela a essas foi introduzida. `src/lib/storage/objetos.ts` não se aplica (feature não lida com arquivos). **PASS** — ver research.md Decisões 2, 3 e 5. |
| III. Decisões de Arquitetura/Segurança Compartilhadas | Nenhuma decisão deste plano introduz dependência nova, muda fluxo de autenticação, ou altera modelo de segurança existente — são tabelas novas isoladas, reusando o gate de painel já existente. As decisões de design (enum vs. cadastro, onde a rota mora) são de implementação dentro do escopo já aprovado na spec, registradas em research.md para review, não decisões de arquitetura/segurança do tipo que a constituição pede para não tomar sozinho. **PASS**. |
| IV. Disciplina de Escopo Local | Estrutura proposta toca apenas arquivos novos (`painel/pacotes/*`, `painel/membros/[membroId]/*`) e duas edições mínimas em arquivos existentes (novo link no `SubNav` do `painel/layout.tsx`; novo link/botão no card de `painel/membros/page.tsx`) — nenhuma refatoração de Desafios ou de outra área. **PASS**. |

Nenhuma violação — **Complexity Tracking** abaixo fica vazio.

## Project Structure

### Documentation (this feature)

```text
specs/001-pacotes-sessoes/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/
│   └── actions.md       # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
prisma/
└── schema.prisma                       # + models TipoSessao, TipoPacote,
                                         #   ItemTipoPacote, CicloPacote,
                                         #   ItemCicloPacote, SessaoRealizada
                                         #   (sem enum — TipoSessao é catálogo)

src/app/painel/
├── layout.tsx                          # + link "Pacotes" no SubNav
├── pacotes/                            # NOVO — catálogo de tipos de sessão e de pacote (US1)
│   ├── page.tsx                        # duas seções na mesma página: Tipos de
│   │                                   #   sessão (lista + form) e Tipos de
│   │                                   #   pacote (lista + form, seletor usa
│   │                                   #   os tipos de sessão já cadastrados)
│   ├── queries.ts                      # listarTiposSessao, listarTiposPacote
│   ├── actions.ts                      # criarTipoSessao, criarTipoPacote
│   ├── formulario-criar-tipo-sessao.tsx
│   ├── formulario-criar-tipo-pacote.tsx
│   ├── page.test.tsx
│   ├── queries.test.ts / queries.integration.test.ts
│   └── actions.test.ts
└── membros/
    ├── page.tsx                        # + link para /painel/membros/[membroId]
    └── [membroId]/                     # NOVO — vincular/marcar/renovar/histórico (US2, US3, US4)
        ├── page.tsx
        ├── queries.ts                  # obterCicloAtivo, listarHistoricoCiclos
        ├── actions.ts                  # vincularPacote, marcarSessaoRealizada, desfazerSessaoRealizada
        ├── formulario-vincular-pacote.tsx
        │   # usa BotaoComConfirmacao (reaproveitado de
        │   # src/components/botao-com-confirmacao.tsx) quando já existe ciclo
        │   # ativo: monta mensagemConfirmacao com o contador por tipo do
        │   # ciclo atual antes de chamar vincularPacote (FR-014). Sem ciclo
        │   # ativo, chama vincularPacote direto (sem confirmação).
        ├── botao-marcar-sessao.tsx
        ├── botao-desfazer-sessao.tsx
        ├── page.test.tsx
        ├── queries.test.ts / queries.integration.test.ts
        └── actions.test.ts
```

**Structure Decision**: extensão do monolito Next.js já existente, seguindo
exatamente a convenção de pasta-por-rota já usada em `painel/desafios/` e
`painel/desafios/[desafioId]/` (page + queries.ts + actions.ts + componentes de
UI + testes colocados). Nenhuma estrutura nova (sem `backend/`/`frontend/`
separados, sem pacote novo) — ver research.md Decisão 4 para o raciocínio de
onde cada parte da feature mora.

## Complexity Tracking

*Sem violações do Constitution Check — seção vazia, nenhuma linha necessária.*
