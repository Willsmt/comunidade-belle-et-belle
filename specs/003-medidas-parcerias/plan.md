# Implementation Plan: Protocolo Completo de Medidas com Leitura por Parceria

**Branch**: `003-medidas-parcerias` | **Date**: 2026-09-27 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-medidas-parcerias/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

`RegistroMedida` (contexto Perfil, rota `/cliente/medidas`) ganha o protocolo
completo de circunferências: `altura` (novo), cinco medidas de tronco de
valor único (`ombro`, `peitoBusto`, `cintura`, `abdomen`, `quadril` — três
novas, duas já existentes) e sete medidas de membro capturadas por lado
(`bracoDireito`/`bracoEsquerdo`, `antebracoDireito`/`antebracoEsquerdo`,
`punhoDireito`/`punhoEsquerdo`, `coxaDireita`/`coxaEsquerda`,
`joelhoDireito`/`joelhoEsquerdo`, `panturrilhaDireita`/`panturrilhaEsquerda`,
`tornozeloDireito`/`tornozeloEsquerdo`). As colunas antigas `braco`/`coxa`
(valor único) são preservadas sem migração — só deixam de ser escritas pelo
formulário novo — pra não perder o significado dos registros históricos. A
cliente continua sendo a única a escrever em `RegistroMedida`; o fluxo de
`/cliente/medidas` não muda de forma, só o formulário/histórico ficam mais
completos.

Duas rotas novas dão à parceria (`PARCERIA`) leitura desse histórico: uma
lista (`/parceria/medidas`, reaproveitando literalmente
`listarClientesVinculadas` de `parceria/planos/queries.ts`) e um detalhe por
cliente (`/parceria/medidas/[clienteId]`, no padrão dinâmico já usado em
`painel/membros/[membroId]`), cuja query (`obterMedidasDaCliente`) reaproveita
exatamente o gate (`requererPapel(["PARCERIA"])`) e a checagem de
`VinculoParceria` (`clienteId_parceriaId`, `ativo: true`) que `enviarPlano` já
usa hoje. Nenhuma action de escrita nessa área — é somente leitura.

Abordagem técnica: só um modelo alterado no Prisma (`RegistroMedida`, campos
novos, sem tabela nova); nenhuma mudança em `VinculoParceria`; dois arquivos
de query novos + dois `page.tsx` novos, reaproveitando componentes de UI
(`Card`, `Badge`) e o padrão de rota dinâmica já existentes; um item novo de
navegação em `parceria/layout.tsx`. Sem dependências novas.

`GraficoEvolucao` (`cliente/medidas/grafico-evolucao.tsx`) entra no escopo
tocado (decisão fechada, research.md Decisão 8): passa a desenhar uma linha
por medida de tronco/membro (5 + 7 = 12, além da `peso` já existente;
`altura` não entra no gráfico). Cada medida de membro é reduzida a um único
ponto por data — média entre o lado direito e o esquerdo quando os dois
existem, ou o único lado preenchido quando só um existe, com fallback para o
campo legado (`braco`/`coxa`) em registros anteriores a esta feature, pra
manter a linha contínua sem nenhuma migração de dado. O gráfico mostra
tendência agregada; a assimetria exata entre lados fica só na tabela de
histórico, que já exibe os valores brutos por campo.

## Technical Context

**Language/Version**: TypeScript, Next.js (App Router) — mesma versão já usada no repositório (ver `package.json`)

**Primary Dependencies**: Prisma (`@prisma/client`, adapter Postgres), NextAuth (`auth()`/`requererPapel` já existentes) — nenhuma dependência nova

**Storage**: PostgreSQL (Neon) via Prisma, só para os campos novos de `RegistroMedida` — sem Cloudflare R2/objetos envolvidos nesta feature (não há upload de arquivo)

**Testing**: Vitest + Testing Library para unit/component (`npm run test`, Prisma mockado); Vitest com config separada para integração contra banco real (`npm run test:integration`) — ambos exigidos pelo Princípio I antes de considerar qualquer tarefa concluída

**Target Platform**: Web (navegador), aplicação Next.js já em produção — sem plataforma nova

**Project Type**: Aplicação web monolítica Next.js já existente — extensão de `src/app/cliente/medidas` e criação de `src/app/parceria/medidas` seguindo a convenção de pasta-por-rota já usada no projeto

**Performance Goals**: Sem meta especial — mesmo padrão das demais telas de cliente/parceria (poucos registros por cliente, sem paginação hoje, mesma ordem de grandeza de `/cliente/medidas` e `/parceria/planos`)

**Constraints**: Deve respeitar o gate de papel `CLIENTE` para escrita (`requererPapel`) e `PARCERIA` para leitura, além da checagem de `VinculoParceria` ativo antes de qualquer leitura por parceria (FR-009, FR-010); não pode alterar quem pode escrever em `RegistroMedida` (só a própria cliente, FR-007); não pode reclassificar retroativamente `braco`/`coxa` de registros antigos (research.md Decisão 4; Princípio IV — escopo local)

**Scale/Scope**: Comunidade de uma esthetics studio (dezenas a poucas centenas de clientes ativas; cada cliente com poucas dezenas de registros de medida ao longo do tempo) — mesma ordem de grandeza das demais tabelas já existentes no schema

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|---|---|
| I. Ciclo Guiado por Teste | Plano segue model (Prisma: campos novos em `RegistroMedida`) → migration → queries/actions (`cliente/medidas/actions.ts`, `parceria/medidas/queries.ts`, `parceria/medidas/[clienteId]/queries.ts`) → view/permissão (gates já existentes, reaproveitados) → testes → commit, como será detalhado em `tasks.md` (`/speckit-tasks`). **PASS** (execução real dos testes acontece na fase de implementação). |
| II. Reaproveitamento de Padrões | Reaproveita `RegistroMedida` existente em vez de tabela nova; reaproveita `requererPapel`/`AppError`/`executarAction`; reaproveita literalmente `listarClientesVinculadas` de `planos/queries.ts` (sem duplicar); reaproveita a checagem de vínculo (`clienteId_parceriaId`, `ativo: true`) exatamente como `enviarPlano` já faz; reaproveita o padrão de rota dinâmica lista→detalhe já validado em `painel/membros/[membroId]`. Nenhuma abstração nova paralela introduzida. **PASS** — ver research.md Decisões 1, 5, 6 e 7. |
| III. Decisões de Arquitetura/Segurança Compartilhadas | Nenhuma dependência nova, fluxo de autenticação novo, ou storage novo introduzido. O único ponto que muda o modelo de dados (campos novos em `RegistroMedida`, `braco`/`coxa` preservados sem migração) segue exatamente o que a spec/prompt já pediu, sem decisão de segurança nova — a leitura por parceria reusa 100% o mecanismo de vínculo já existente e já aprovado para planos, sem introduzir um novo nível de permissão. A extensão de `GraficoEvolucao` (research.md Decisão 8) é uma regra de apresentação (agregação por média/lado único/legado), fechada explicitamente pela responsável antes desta versão do plano — não é mais um item de review pendente. **PASS**. |
| IV. Disciplina de Escopo Local | Toca só `prisma/schema.prisma` (um model), `src/app/cliente/medidas/*` (formulário/histórico/actions) e `src/app/parceria/medidas/*` (novo) + um link em `src/app/parceria/layout.tsx`. Nenhuma mudança em Desafios, Pacotes de Sessões, Feed ou qualquer área fora de Perfil/Parcerias. **PASS**. |

Nenhuma violação sem justificativa — **Complexity Tracking** abaixo fica vazio.

**Re-check pós-design (Fase 1)**: `data-model.md` e `contracts/actions.md` não
introduziram nenhuma tabela, dependência ou fluxo de autenticação novos além
do previsto acima — os quatro gates continuam **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/003-medidas-parcerias/
├── plan.md               # This file (/speckit-plan command output)
├── research.md           # Phase 0 output (/speckit-plan command)
├── data-model.md          # Phase 1 output (/speckit-plan command)
├── quickstart.md          # Phase 1 output (/speckit-plan command)
├── contracts/
│   └── actions.md        # Phase 1 output (/speckit-plan command)
└── tasks.md               # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
prisma/
└── schema.prisma                          # RegistroMedida: + altura, + ombro/
                                            #   peitoBusto/abdomen (tronco),
                                            #   + 14 campos bilaterais de
                                            #   membro; braco/coxa preservados
                                            #   (research.md Decisão 4)

src/app/cliente/medidas/
├── actions.ts                             # criarRegistroMedida: CAMPOS_MEDIDA
                                            #   passa a listar os 20 campos
                                            #   novos (sem braco/coxa)
├── formulario-registro.tsx                # + campos de tronco e membro
                                            #   (bilateral, D/E lado a lado)
├── page.tsx                               # histórico exibe os campos novos
                                            #   quando preenchidos; registros
                                            #   antigos continuam mostrando
                                            #   braco/coxa sem lado; monta
                                            #   pontosGrafico com valorMembro
                                            #   (research.md Decisão 8)
├── grafico-evolucao.tsx                   # PontoEvolucao ganha as 5 medidas
                                            #   de tronco + 7 de membro (12
                                            #   linhas novas, além de peso já
                                            #   existente); altura não entra
                                            #   no gráfico (research.md
                                            #   Decisão 8)
├── queries.ts                             # sem mudança de código — findMany
                                            #   sem select já traz os campos
                                            #   novos
└── actions.test.ts / page.test.tsx / queries.integration.test.ts
    # atualizados para os campos novos + caso de registro antigo (US1) +
    # cálculo de valorMembro (média/lado único/legado) no gráfico

src/app/parceria/medidas/
├── queries.ts                             # NOVO — reexporta
                                            #   listarClientesVinculadas de
                                            #   ../planos/queries (research.md
                                            #   Decisão 7)
├── page.tsx                               # NOVO — lista clientes vinculadas,
                                            #   link para o detalhe
├── [clienteId]/
│   ├── queries.ts                         # NOVO — obterMedidasDaCliente:
                                            #   requererPapel(["PARCERIA"]) +
                                            #   checagem de VinculoParceria
                                            #   ativo (research.md Decisão 6)
│   └── page.tsx                           # NOVO — histórico somente leitura
                                            #   da cliente escolhida
└── queries.test.ts / page.test.tsx / queries.integration.test.ts /
    [clienteId]/queries.test.ts / [clienteId]/page.test.tsx /
    [clienteId]/queries.integration.test.ts
    # novos, cobrindo US2 e US3 (isolamento por vínculo)

src/app/parceria/layout.tsx                # + link "Medidas das clientes"
                                            #   no SubNav
```

**Structure Decision**: extensão do monolito Next.js já existente, seguindo a
convenção de pasta-por-rota já usada em `cliente/medidas/` e
`painel/membros/[membroId]/` (page + queries.ts + actions.ts quando há
escrita + testes colocados). A área da parceria ganha o padrão lista→detalhe
(`/parceria/medidas` → `/parceria/medidas/[clienteId]`) em vez de uma página
única com seletor, por ser mais fiel a um padrão já existente no projeto para
"escolher uma cliente vinculada e ver uma linha do tempo dela" (research.md
Decisão 5). Nenhuma estrutura nova fora de `src/app` e nenhuma dependência
nova.

## Complexity Tracking

*Sem violações do Constitution Check — seção vazia, nenhuma linha necessária.
A extensão de `GraficoEvolucao` para os campos novos (research.md Decisão 8)
está dentro do escopo tocado por este plano, com a regra de agregação
documentada em research.md e data-model.md — não é uma violação de
princípio.*
