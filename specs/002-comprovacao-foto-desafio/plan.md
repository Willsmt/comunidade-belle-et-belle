# Implementation Plan: Comprovação de Foto por Critério de Desafio

**Branch**: `002-comprovacao-foto-desafio` | **Date**: 2026-09-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-comprovacao-foto-desafio/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

A Patty marca, item por item ao cadastrar um critério de desafio mensal, se
ele "exige foto" (opcional, desmarcado por padrão). Quando exige, a cliente
precisa anexar uma foto (mesmo pipeline de compressão/R2 já usado em fotos de
evolução e desafio surpresa) ao marcar o item no dia, e os pontos daquele item
ficam de fora do ranking até a Patty decidir. A decisão (aprovar/rejeitar)
passa a acontecer numa fila única em `/painel/aprovacoes`, que passa a reunir
tanto essas comprovações de item quanto as participações de desafio surpresa
pendentes (hoje decididas dentro da tela do desafio). Aprovar libera o ponto e
apaga a foto do R2; rejeitar apaga o registro da marcação (a cliente pode
marcar de novo) e também apaga a foto. Itens sem "exige foto" continuam
pontuando na hora, sem trava — nenhuma mudança de comportamento pra eles.

Abordagem técnica: dois campos novos em modelos já existentes do Prisma
(`ItemDesafio.exigeFoto`, e `MarcacaoItem.fotoChave`/`validado`/`validadoPor`/
`validadoEm` — espelhando exatamente o que `DesafioSurpresa`/`ParticipacaoSurpresa`
já fazem), um módulo novo de storage (`comprovantes-item-desafio.ts`, cópia
estrutural de `comprovantes-surpresa.ts`), duas novas Server Actions no painel
de aprovações, uma nova Server Action + formulário no lado da cliente, e um
ajuste no cálculo de ranking/bônus/emblemas (`cliente/desafios/queries.ts` e
`lib/desafios/conquistas.ts`) para filtrar por `validado: true` — sem tabelas
novas, sem dependências novas.

> **Decisões que estendem código fora do escopo literal da spec** (ver
> research.md Decisões 3 e 4 para o raciocínio completo): (1) `aprovarParticipacao`/
> `rejeitarParticipacao` de desafio surpresa passam a apagar a foto do R2 —
> hoje elas não fazem isso, o que deixaria a mesma tela unificada limpando
> storage só pra metade dos casos; (2) os cálculos de bônus/emblema de ranking
> em `conquistas.ts` passam a respeitar `validado: true`, senão um item
> pendente ainda dispararia combos/limiares/emblemas mesmo "bloqueado" do
> ranking. Ambas isoladas e revertíveis se a Patty preferir o comportamento
> atual do desafio surpresa nesses dois pontos.

## Technical Context

**Language/Version**: TypeScript, Next.js (App Router) — mesma versão já usada no repositório (ver `package.json`)

**Primary Dependencies**: Prisma (`@prisma/client`, adapter Postgres), NextAuth (`auth()`/`requererAcessoPainel`/`requererPapel` já existentes), `@aws-sdk/client-s3` + `sharp` (via `src/lib/storage/objetos.ts` e `comprimir-imagem.ts`, já usados por evolução/desafio surpresa) — nenhuma dependência nova

**Storage**: PostgreSQL (Neon) via Prisma para os dois campos/relacionamentos novos; Cloudflare R2 (via `src/lib/storage/objetos.ts`) para as fotos de comprovação de item, num novo módulo fino `comprovantes-item-desafio.ts` — mesmo mecanismo já usado em `comprovantes-surpresa.ts`/`jornada-desafio.ts` (Princípio II; research.md Decisão 8)

**Testing**: Vitest + Testing Library para unit/component (`npm run test`, Prisma mockado); Vitest com config separada para integração contra banco real (`npm run test:integration`) — ambos exigidos pelo Princípio I antes de considerar qualquer tarefa concluída

**Target Platform**: Web (navegador), aplicação Next.js já em produção — sem plataforma nova

**Project Type**: Aplicação web monolítica Next.js já existente — extensão de `src/app/painel/desafios`, `src/app/painel/aprovacoes`, `src/app/cliente/desafios` e `src/lib/desafios`/`src/lib/storage`, não um projeto/estrutura nova

**Performance Goals**: Sem meta especial — mesmo padrão das demais telas do painel/cliente (poucas dezenas de itens/comprovações pendentes por consulta, sem paginação hoje)

**Constraints**: Deve respeitar o gate de acesso ao painel (`requererAcessoPainel`) e ao papel `CLIENTE` (`requererPapel`); não pode alterar o comportamento de itens sem "exige foto" (FR-005) nem de Pacotes de Sessões (Princípio IV — escopo local); tamanho/formato de imagem seguem os mesmos limites já validados em `comprovantes-surpresa.ts` (JPEG/PNG/WebP, até 5MB antes da compressão)

**Scale/Scope**: Comunidade de uma esthetics studio (dezenas a poucas centenas de clientes ativas; poucas dezenas de itens de desafio, tipicamente poucos com "exige foto") — mesma ordem de grandeza das demais tabelas já existentes no schema

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|---|---|
| I. Ciclo Guiado por Teste | Plano segue model (Prisma: `exigeFoto`, `validado`/`validadoPor`/`validadoEm`/`fotoChave`) → migration → queries/actions (`painel/desafios/[desafioId]`, `painel/aprovacoes`, `cliente/desafios`, `lib/desafios/conquistas.ts`) → view/permissão (gates já existentes) → testes → commit, como será detalhado em `tasks.md` (`/speckit-tasks`). **PASS** (execução real dos testes acontece na fase de implementação). |
| II. Reaproveitamento de Padrões | Reaproveita a forma de `ParticipacaoSurpresa`/`DesafioSurpresa` (comprovação opcional + aprovação) para `MarcacaoItem`/`ItemDesafio`; reaproveita `src/lib/storage/objetos.ts` + `comprimir-imagem.ts` via um módulo fino no padrão de `comprovantes-surpresa.ts`; reaproveita `requererAcessoPainel`/`requererPapel`, `useAcaoComErro`, `executarAction`, e o padrão de botão de alternância único (`BotaoReabrirDesafio`) em vez de construir edição genérica de item. Nenhuma abstração nova paralela introduzida. **PASS** — ver research.md Decisões 1, 5, 6 e 8. |
| III. Decisões de Arquitetura/Segurança Compartilhadas | Nenhuma dependência nova, fluxo de autenticação novo, ou storage novo é introduzido — reaproveita R2/Postgres já em uso, sob os mesmos gates de acesso já existentes. As duas extensões de comportamento em código existente (limpeza de storage do desafio surpresa; bônus/emblemas respeitando `validado`) são registradas explicitamente em research.md (Decisões 3 e 4) e no Summary acima para review — não são decisões de infraestrutura/segurança do tipo que a constituição pede pra não tomar sozinho, mas mudam comportamento observável de uma feature vizinha (desafio surpresa) e por isso são sinalizadas de forma destacada em vez de silenciosas. **PASS com nota**. |
| IV. Disciplina de Escopo Local | Toca `painel/desafios/[desafioId]` (novo campo/checkbox, novo botão de alternância, limpeza de foto nas actions de participação), `painel/aprovacoes` (novas queries/actions, UI unificada), `cliente/desafios` (nova action/formulário, filtro de ranking), `lib/desafios/conquistas.ts` (filtro `validado`) e um módulo novo de storage. Nenhuma mudança em Pacotes de Sessões, Perfil, Parcerias ou qualquer área fora de Desafios/Aprovações. **PASS**. |

Nenhuma violação sem justificativa — **Complexity Tracking** abaixo fica vazio;
as duas extensões de escopo (Decisões 3 e 4) estão justificadas acima e em
research.md, não como violação de princípio, mas como decisão de design
sinalizada para review.

**Re-check pós-design (Fase 1)**: `data-model.md` e `contracts/actions.md` não
introduziram nenhuma tabela, dependência ou fluxo de autenticação novos além
do previsto acima — os quatro gates continuam **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/002-comprovacao-foto-desafio/
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
└── schema.prisma                          # ItemDesafio.exigeFoto;
                                            #   MarcacaoItem.fotoChave/validado/
                                            #   validadoPor/validadoEm

src/lib/storage/
└── comprovantes-item-desafio.ts           # NOVO — cópia estrutural de
                                            #   comprovantes-surpresa.ts, prefixo
                                            #   de chave próprio (research.md
                                            #   Decisão 8)

src/lib/desafios/
└── conquistas.ts                          # calcularRankingParaConquista e
                                            #   regraSatisfeitaHoje passam a
                                            #   filtrar MarcacaoItem por
                                            #   validado: true (Decisão 4)

src/app/painel/desafios/[desafioId]/
├── actions.ts                             # criarItem += exigeFoto;
                                            #   + alternarExigeFoto;
                                            #   aprovarParticipacao/
                                            #   rejeitarParticipacao += apagar
                                            #   foto do R2 (Decisão 3) e
                                            #   revalidatePath("/painel/aprovacoes")
├── formulario-criar-item.tsx              # + checkbox "Exige foto"
├── botao-alternar-exige-foto.tsx          # NOVO — mesmo padrão de
                                            #   botao-reabrir-desafio.tsx
├── page.tsx                               # itens mostram indicador "exige
                                            #   foto"; participações de desafio
                                            #   surpresa viram só histórico
                                            #   (badge de status, sem botões
                                            #   de decisão — Decisão 2)
└── actions.test.ts / page.test.tsx / actions.integration.test.ts
    # atualizados para os pontos acima

src/app/painel/aprovacoes/
├── queries.ts                             # + listarComprovacoesPendentes()
├── actions.ts                             # + aprovarMarcacaoItem,
                                            #   rejeitarMarcacaoItem
├── page.tsx                               # + seções de comprovação de item e
                                            #   de participação de desafio
                                            #   surpresa pendentes, ao lado da
                                            #   fila de contas já existente
├── botao-aprovar-marcacao-item.tsx        # NOVO — mesmo padrão de
                                            #   botao-aprovar-conta.tsx
└── queries.test.ts / actions.test.ts / page.test.tsx / queries.integration.test.ts
    # novos casos + os já existentes

src/app/cliente/desafios/
├── actions.ts                             # alternarMarcacao rejeita item com
                                            #   exigeFoto; + marcarItemComFoto
├── queries.ts                             # itensMarcadosHoje vira
                                            #   Map<itemId, { validado }>;
                                            #   calcularRanking filtra
                                            #   MarcacaoItem por validado: true
├── formulario-marcar-item-com-foto.tsx    # NOVO — mesmo padrão de
                                            #   formulario-participar-surpresa.tsx
├── botao-marcar-item.tsx                  # sem mudança de contrato (só usado
                                            #   para itens sem exigeFoto)
├── page.tsx                               # escolhe BotaoMarcarItem ou
                                            #   FormularioMarcarItemComFoto por
                                            #   item.exigeFoto; mostra estado
                                            #   "aguardando aprovação" (FR-012)
└── actions.test.ts / queries.test.ts / page.test.tsx / queries.integration.test.ts
    # novos casos + os já existentes
```

**Structure Decision**: extensão do monolito Next.js já existente, seguindo a
convenção de pasta-por-rota já usada em `painel/desafios/[desafioId]/` e
`painel/aprovacoes/` (page + queries.ts + actions.ts + componentes de UI +
testes colocados). Nenhuma estrutura nova — as duas únicas adições fora de
`src/app` são o módulo de storage (mesmo padrão dos já existentes em
`src/lib/storage/`) e o ajuste pontual em `src/lib/desafios/conquistas.ts`
(módulo de domínio já compartilhado por Desafios/desafio surpresa).

## Complexity Tracking

*Sem violações do Constitution Check — seção vazia, nenhuma linha necessária.
As duas extensões de comportamento fora do escopo literal da spec (limpeza de
storage e filtro de bônus para desafio surpresa/emblemas) estão documentadas
como decisões de design em research.md (Decisões 3 e 4), não como violações
de princípio.*
