---

description: "Task list template for feature implementation"
---

# Tasks: Pacotes de Sessões

**Input**: Design documents from `/specs/001-pacotes-sessoes/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/actions.md, quickstart.md (todos lidos e considerados)

**Tests**: incluídos em cada fase — o Princípio I da constituição (`.specify/memory/constitution.md`) exige model → migration → serializer → view/permissão → **TESTES** → commit, e proíbe considerar qualquer tarefa concluída sem saída real de execução de teste passando (`npm run test` / `npm run test:integration`).

**Organization**: tarefas agrupadas por user story (spec.md) para permitir implementação e teste independentes de cada uma.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivo diferente, sem dependência de tarefa incompleta)
- **[Story]**: a qual user story a tarefa pertence (US1, US2, US3, US4)
- Caminhos de arquivo exatos em cada descrição

## Path Conventions

Aplicação Next.js (App Router) já existente — sem `backend/`/`frontend/` separados. Caminhos conforme `plan.md` § Project Structure: `prisma/schema.prisma`, `src/app/painel/pacotes/`, `src/app/painel/membros/`, `src/app/painel/membros/[membroId]/`.

---

## Phase 1: Setup

**Purpose**: confirmar baseline antes de tocar em código — este projeto já tem toda a infraestrutura necessária (Prisma, Vitest, Next.js); não há dependência nova a instalar.

- [X] T001 Confirmar baseline verde antes de iniciar: `npm run lint`, `npm run typecheck`, `npm run test` sem erros pré-existentes bloqueando a feature (nenhum arquivo novo nesta tarefa).

**Checkpoint**: baseline verificado — pronto para o schema da feature.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: schema de banco compartilhado por todas as user stories. Nenhuma story pode começar antes desta fase.

**⚠️ CRITICAL**: bloqueia US1, US2, US3 e US4.

- [X] T002 Adicionar em `prisma/schema.prisma` os 6 models da feature (ver `data-model.md`), sem enum — todas as referências a tipo de sessão são FK:
  - `TipoSessao`: `id String @id @default(cuid())`, `nome String @unique`, `criadoEm DateTime @default(now())`, relations `itensTipoPacote ItemTipoPacote[]`, `itensCicloPacote ItemCicloPacote[]`, `sessoesRealizadas SessaoRealizada[]`.
  - `TipoPacote`: `id`, `nome String`, `itens ItemTipoPacote[]`, `ciclos CicloPacote[]`, `criadoEm`.
  - `ItemTipoPacote`: `id`, `tipoPacoteId String` (`onDelete: Cascade`), `tipoSessaoId String` (FK para `TipoSessao`), `quantidade Int`, `@@unique([tipoPacoteId, tipoSessaoId])`.
  - `CicloPacote`: `id`, `clienteId String` (`onDelete: Cascade`), `tipoPacoteId String`, `nomePacote String` (snapshot), `itens ItemCicloPacote[]`, `sessoes SessaoRealizada[]`, `ativo Boolean @default(true)`, `criadoEm`, `arquivadoEm DateTime?`, `@@index([clienteId, ativo])`.
  - `ItemCicloPacote`: `id`, `cicloPacoteId String` (`onDelete: Cascade`), `tipoSessaoId String` (FK), `quantidadeContratada Int`, `@@unique([cicloPacoteId, tipoSessaoId])`.
  - `SessaoRealizada`: `id`, `cicloPacoteId String` (`onDelete: Cascade`), `tipoSessaoId String` (FK), `data DateTime @db.Date`, `marcadoPorId String`, `criadoEm`, `@@index([cicloPacoteId, tipoSessaoId])`.
- [X] T003 Rodar `npm run db:migrate` (gera e aplica a migration dos models de T002) e `npm run db:generate` (atualiza `@prisma/client`); confirmar saída sem erro antes de seguir (depende de T002).

**Checkpoint**: schema pronto — US1, US2, US3 e US4 podem começar.

---

## Phase 3: User Story 1 - Cadastrar tipos de pacote (Priority: P1) 🎯 MVP (parte 1)

**Goal**: a Patty cadastra tipos de sessão e tipos de pacote (nome + composição) pelo painel.

**Independent Test**: cria um tipo de pacote (nome + tipos de sessão + quantidades), salva, e vê o pacote listado com a composição correta, sem precisar de nenhuma cliente vinculada.

### Implementation for User Story 1

- [X] T004 [US1] Implementar em `src/app/painel/pacotes/queries.ts`: `listarTiposSessao()` (todos os `TipoSessao`, `orderBy: { nome: "asc" }`) e `listarTiposPacote()` (todos os `TipoPacote` com `itens` incluindo o `tipoSessao` relacionado, `orderBy: { criadoEm: "desc" }`).
- [X] T005 [US1] Implementar em `src/app/painel/pacotes/actions.ts`, dentro de `executarAction` e após `requererAcessoPainel()`:
  - `criarTipoSessao(formData)`: valida `nome` não vazio (`AppError` caso contrário); cria `TipoSessao`; traduz erro de unicidade do Prisma (`nome` duplicado) em `AppError` amigável; `revalidatePath("/painel/pacotes")`.
  - `criarTipoPacote(formData)`: valida `nome` não vazio; valida `itens.length >= 1` ("ao menos um tipo de sessão com quantidade é obrigatório" — FR-002); valida cada `quantidade >= 1`; valida sem `tipoSessaoId` repetido na lista; valida cada `tipoSessaoId` existente; cria `TipoPacote` + `ItemTipoPacote[]` numa transação; `revalidatePath("/painel/pacotes")`.
- [X] T006 [P] [US1] Criar `src/app/painel/pacotes/formulario-criar-tipo-sessao.tsx` ("use client"): campo `nome`, `useAcaoComErro`, chama `criarTipoSessao` (depende de T005).
- [X] T007 [P] [US1] Criar `src/app/painel/pacotes/formulario-criar-tipo-pacote.tsx` ("use client"): campo `nome`, lista dinâmica de linhas `{ tipoSessaoId (select populado pela prop de tipos de sessão), quantidade }` com adicionar/remover linha, `useAcaoComErro`, chama `criarTipoPacote` (depende de T005).
- [X] T008 [US1] Criar `src/app/painel/pacotes/page.tsx` (Server Component): busca `listarTiposSessao()` e `listarTiposPacote()` em paralelo (`Promise.all`); renderiza seção "Tipos de sessão" (lista + `FormularioCriarTipoSessao`) e seção "Tipos de pacote" (lista com composição + `FormularioCriarTipoPacote`, passando os tipos de sessão como opções do seletor) (depende de T004, T006, T007).
- [X] T009 [P] [US1] Adicionar `{ href: "/painel/pacotes", label: "Pacotes" }` ao array `links` do `SubNav` em `src/app/painel/layout.tsx`.

### Tests for User Story 1

- [X] T010 [P] [US1] `src/app/painel/pacotes/actions.test.ts` (Prisma mockado): `criarTipoPacote` rejeita nome vazio; rejeita `itens` vazio (Acceptance Scenario 2 da US1 / FR-002); rejeita `quantidade < 1`; rejeita `tipoSessaoId` repetido; `criarTipoSessao` rejeita nome vazio e nome duplicado; ambas rejeitam sem `requererAcessoPainel()` (FR-012).
- [X] T011 [P] [US1] `src/app/painel/pacotes/queries.test.ts` (Prisma mockado): `listarTiposSessao`/`listarTiposPacote` retornam ordenação e formato esperados.
- [X] T012 [P] [US1] `src/app/painel/pacotes/queries.integration.test.ts` (banco de teste real): criar `TipoSessao` + `TipoPacote` + `ItemTipoPacote` via Prisma e confirmar que `listarTiposPacote()` retorna a composição correta (Acceptance Scenario 1 da US1).
- [X] T013 [P] [US1] `src/app/painel/pacotes/page.test.tsx`: cadastro completo (nome + 3 tipos de sessão com quantidades) aparece na lista após salvar (Acceptance Scenario 1); salvar sem nenhum tipo de sessão mostra erro e não salva (Acceptance Scenario 2).

**Checkpoint**: US1 completa e testável de forma independente — catálogo pronto para ser usado pela US2.

---

## Phase 4: User Story 2 - Vincular pacote, acompanhar e marcar sessões realizadas (Priority: P1) 🎯 MVP (parte 2)

**Goal**: a Patty vincula um pacote a uma cliente sem ciclo ativo, acompanha o contador por tipo (X/Y) e marca/desfaz sessões realizadas.

**Independent Test**: com um tipo de pacote já cadastrado (US1), vincula a uma cliente sem ciclo ativo, vê contadores 0/Y, marca uma sessão de um tipo e confirma 1/Y sem afetar os outros tipos; bloqueia ao atingir Y/Y; desfazer volta o contador.

### Implementation for User Story 2

- [X] T014 [US2] Implementar em `src/app/painel/membros/[membroId]/queries.ts`: `obterCicloAtivo(clienteId)` — retorna o `CicloPacote` com `ativo: true` da cliente (ou `null`), com `itens` incluindo, por `ItemCicloPacote`, `tipoSessao` (nome), `quantidadeContratada`, e `quantidadeRealizada` calculado via `prisma.sessaoRealizada.count({ where: { cicloPacoteId, tipoSessaoId } })` (não armazenado — research.md Decisão 2).
- [X] T015 [US2] Implementar em `src/app/painel/membros/[membroId]/actions.ts`, dentro de `executarAction` e após `requererAcessoPainel()`: `vincularPacote(clienteId, tipoPacoteId)` — numa transação: se existir `CicloPacote` `ativo: true` da `clienteId`, atualiza para `{ ativo: false, arquivadoEm: new Date() }`; cria novo `CicloPacote` (`ativo: true`, `nomePacote` = snapshot do `TipoPacote.nome` atual) com `ItemCicloPacote[]` copiado de `ItemTipoPacote[]` (`quantidadeContratada` = `ItemTipoPacote.quantidade`); `AppError` se `tipoPacoteId` não existir; `revalidatePath` da rota do membro (depende de T002/T003).
- [X] T016 [US2] Implementar em `src/app/painel/membros/[membroId]/actions.ts`: `marcarSessaoRealizada(cicloPacoteId, tipoSessaoId, data?)` — `AppError` se o ciclo não estiver `ativo: true`; `AppError` se `tipoSessaoId` não tiver `ItemCicloPacote` nesse ciclo; `AppError` "o limite do pacote para aquele tipo já foi cumprido" se `count(SessaoRealizada) >= quantidadeContratada` (FR-007); cria `SessaoRealizada` com `marcadoPorId` = usuário autenticado e `data` = hoje quando omitida (depende de T014/T015).
- [X] T017 [US2] Implementar em `src/app/painel/membros/[membroId]/actions.ts`: `desfazerSessaoRealizada(sessaoRealizadaId)` — `delete` direto da linha (qualquer uma, não só a mais recente — FR-008); `AppError` se não existir.
- [X] T018 [P] [US2] Criar `src/app/painel/membros/[membroId]/botao-marcar-sessao.tsx` ("use client", `useAcaoComErro`): botão por tipo de sessão, desabilitado e com aviso quando `quantidadeRealizada >= quantidadeContratada` (Acceptance Scenario 3), chama `marcarSessaoRealizada`.
- [X] T019 [P] [US2] Criar `src/app/painel/membros/[membroId]/botao-desfazer-sessao.tsx` ("use client", `useAcaoComErro`): por sessão marcada no histórico, chama `desfazerSessaoRealizada` (Acceptance Scenario 4).
- [X] T020 [US2] Criar `src/app/painel/membros/[membroId]/formulario-vincular-pacote.tsx` ("use client"): versão inicial cobrindo o caso "cliente sem ciclo ativo" — select de `TipoPacote` (reaproveitando `listarTiposPacote()` de `painel/pacotes/queries.ts`) + botão que chama `vincularPacote` diretamente, sem confirmação (Acceptance Scenario 1 da US2; a confirmação para "já tem ciclo ativo" é adicionada na US3/FR-014) (depende de T015).
- [X] T021 [US2] Criar `src/app/painel/membros/[membroId]/page.tsx` (Server Component): busca `obterCicloAtivo(clienteId)`; sem ciclo ativo, mostra aviso claro (Acceptance Scenario 5) + `FormularioVincularPacote`; com ciclo ativo, mostra contador X/Y por tipo com `BotaoMarcarSessao`, e a lista de sessões do ciclo com `BotaoDesfazerSessao` (depende de T014, T018, T019, T020).
- [X] T022 [P] [US2] Adicionar em cada card de `src/app/painel/membros/page.tsx` um link para `/painel/membros/${membro.id}`.

### Tests for User Story 2

- [X] T023 [P] [US2] `src/app/painel/membros/[membroId]/actions.test.ts` (Prisma mockado): `vincularPacote` cria ciclo com contadores zerados quando não há ciclo ativo (Acceptance Scenario 1); `marcarSessaoRealizada` incrementa só o tipo marcado (Acceptance Scenario 2); bloqueia ao atingir `quantidadeContratada` (Acceptance Scenario 3 / FR-007); `desfazerSessaoRealizada` remove e o contador calculado reflete a remoção (Acceptance Scenario 4 / FR-008); todas rejeitam sem `requererAcessoPainel()` (FR-012).
- [X] T024 [P] [US2] `src/app/painel/membros/[membroId]/queries.test.ts` (Prisma mockado): `obterCicloAtivo` retorna `null` sem ciclo ativo e contadores calculados corretos com ciclo ativo.
- [X] T025 [P] [US2] `src/app/painel/membros/[membroId]/queries.integration.test.ts` (banco de teste real): fluxo completo vincular → marcar 4× → bloquear a 5ª → desfazer 1 → contador reflete 3/4.
- [X] T026 [P] [US2] `src/app/painel/membros/[membroId]/page.test.tsx`: sem ciclo ativo mostra aviso claro e não exibe contadores (Acceptance Scenario 5); com ciclo, mostra X/Y correto por tipo.

**Checkpoint**: US1 + US2 funcionam juntas — MVP completo (cadastrar pacote, vincular a uma cliente nova, marcar/desfazer sessões).

---

## Phase 5: User Story 3 - Renovar pacote (Priority: P2)

**Goal**: a Patty renova o pacote de uma cliente que já tem ciclo ativo, com confirmação explícita mostrando o estado atual antes de arquivar.

**Independent Test**: com uma cliente já com ciclo ativo, aciona renovar, escolhe um tipo de pacote, confirma vendo o contador atual, e o novo ciclo é criado com o anterior arquivado (consultável); cancelar não altera nada.

### Implementation for User Story 3

- [X] T027 [US3] Estender `src/app/painel/membros/[membroId]/formulario-vincular-pacote.tsx`: quando `obterCicloAtivo` já retorna um ciclo, usar `BotaoComConfirmacao` (`src/components/botao-com-confirmacao.tsx`) — `mensagemConfirmacao` montada com o contador por tipo do ciclo atual (ex.: `"Aplicação 3/4, Radiofrequência 0/4, Ultrassom 0/4"`) antes de chamar `vincularPacote`; rótulo do botão passa a "Renovar pacote"; cancelar a confirmação não chama a action (FR-014, Acceptance Scenarios 1 e 2 da US3) (depende de T020, T015).
- [X] T027b [US3] Atualizar `src/app/painel/membros/[membroId]/page.tsx`: no branch "com ciclo ativo" (o mesmo que hoje renderiza o contador X/Y + `BotaoMarcarSessao`, criado em T021), renderizar também o `FormularioVincularPacote` (agora estendido por T027) como ação "Renovar pacote", passando o `cicloAtivo` atual como prop para alimentar a mensagem de confirmação do `BotaoComConfirmacao` — sem esta tarefa, o formulário estendido em T027 existe no código mas não fica alcançável pela UI quando já há ciclo ativo (depende de T021, T027).

### Tests for User Story 3

- [X] T028 [P] [US3] `src/app/painel/membros/[membroId]/page.test.tsx`: renderizar a página inteira com um ciclo ativo mockado e confirmar que o gatilho "Renovar pacote" aparece na tela (prova de que T027b conectou o formulário ao branch certo) e abre a confirmação corretamente, mostrando o contador do ciclo atual; confirmar chama `vincularPacote`; cancelar NÃO chama `vincularPacote` e nada muda na tela (Acceptance Scenarios 1 e 2 da US3) — não basta testar o formulário isolado fora do contexto da página.
- [X] T029 [P] [US3] `src/app/painel/membros/[membroId]/queries.integration.test.ts`: renovar (chamar `vincularPacote` com ciclo já ativo) arquiva o ciclo anterior (`ativo: false`, `arquivadoEm` preenchido) sem apagar seus `ItemCicloPacote`/`SessaoRealizada`, e cria um novo ciclo ativo com contadores zerados (Acceptance Scenario 3 da US3 / FR-009 / FR-010).

**Checkpoint**: US1 + US2 + US3 funcionam juntas — renovação segura, com confirmação, sem perda de histórico.

---

## Phase 6: User Story 4 - Histórico de sessões realizadas (Priority: P3)

**Goal**: ver o histórico de sessões realizadas (com data), incluindo ciclos já arquivados, não só o contador do ciclo ativo.

**Independent Test**: com sessões marcadas em mais de um ciclo (um ativo, um arquivado por renovação), abrir o histórico mostra todas, cada uma com tipo, data, e a qual ciclo pertence.

### Implementation for User Story 4

- [X] T030 [US4] Implementar em `src/app/painel/membros/[membroId]/queries.ts`: `listarHistoricoCiclos(clienteId)` — todos os `CicloPacote` da cliente (ativos e arquivados) com `sessoes` (tipo via relação + `data`), `orderBy: { criadoEm: "desc" }` (FR-011).
- [X] T031 [US4] Adicionar seção de histórico em `src/app/painel/membros/[membroId]/page.tsx`: lista as sessões de `listarHistoricoCiclos`, cada uma com tipo de sessão e data, indicando a qual ciclo pertence (ativo ou arquivado) (Acceptance Scenarios 1 e 2 da US4) (depende de T030).

### Tests for User Story 4

- [X] T032 [P] [US4] `src/app/painel/membros/[membroId]/queries.test.ts` (Prisma mockado): `listarHistoricoCiclos` retorna formato e ordenação esperados, incluindo ciclos arquivados.
- [X] T033 [P] [US4] `src/app/painel/membros/[membroId]/queries.integration.test.ts`: cliente com um ciclo arquivado (por renovação) e um ciclo ativo, ambos com sessões — `listarHistoricoCiclos` retorna as sessões de ambos, corretamente atribuídas a cada ciclo (Acceptance Scenario 2 da US4 / FR-011).
- [X] T034 [P] [US4] `src/app/painel/membros/[membroId]/page.test.tsx`: 3 sessões marcadas em datas diferentes no ciclo ativo aparecem no histórico, cada uma com tipo e data (Acceptance Scenario 1 da US4).

**Checkpoint**: todas as 4 user stories funcionam de forma independente e testável.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: validação final cobrindo todas as user stories juntas.

- [X] T035 [P] Rodar `npm run lint` e `npm run typecheck` no repositório e corrigir qualquer problema introduzido pela feature.
- [X] T036 Executar o roteiro de validação manual de `specs/001-pacotes-sessoes/quickstart.md` do início ao fim e confirmar cada passo (inclui o gate de acesso do FR-012 para papel `CLIENTE`).
- [X] T037 [P] Revisar as mensagens de `AppError` das novas actions (`criarTipoSessao`, `criarTipoPacote`, `vincularPacote`, `marcarSessaoRealizada`, `desfazerSessaoRealizada`) quanto à clareza para uma usuária não-técnica, ajustando onde necessário.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências.
- **Foundational (Phase 2)**: depende de Setup — bloqueia todas as user stories.
- **User Stories (Phase 3-6)**: todas dependem do Foundational.
  - US1 e US2 dependem apenas do schema (Foundational), não uma da outra em termos de código — mas operacionalmente US2 precisa de ao menos um `TipoPacote` cadastrado (via US1) para ter o que vincular, e a ordem de prioridade (P1, P1) e o plano recomendam implementar US1 primeiro.
  - US3 estende a mesma action (`vincularPacote`) e o mesmo componente (`formulario-vincular-pacote.tsx`) criados na US2 — depende de US2 estar implementada (não apenas do Foundational). Em especial, T027b depende diretamente de T021 (US2) além de T027 (US3): T021 é quem criou o branch "com ciclo ativo" de `page.tsx` onde o formulário estendido precisa ser encaixado — sem T021 já pronto, não há onde plugar o gatilho "Renovar pacote".
  - US4 depende apenas do Foundational (lê `CicloPacote`/`SessaoRealizada` diretamente), mas só fica útil para teste manual depois que US2 (e idealmente US3) já gerou dados.
- **Polish (Phase 7)**: depende de todas as user stories desejadas estarem completas.

### Within Each User Story

- Model/schema (Foundational) → queries (serializer) → actions (view/permissão) → componentes de UI → página → testes → commit (Princípio I da constituição).
- Dentro de cada actions.ts, tarefas que editam o mesmo arquivo são sequenciais (não [P] entre si).

### Parallel Opportunities

- Todos os testes de uma mesma fase, marcados [P], podem rodar em paralelo entre si (arquivos diferentes).
- T006 e T007 (dois formulários diferentes da US1) podem ser feitos em paralelo.
- T018 e T019 (botão marcar vs. botão desfazer da US2) podem ser feitos em paralelo.
- T009 (link no SubNav) e T022 (link no card de Membros) são edições pontuais independentes do resto e podem ser feitas em paralelo com qualquer outra tarefa da mesma fase.

---

## Parallel Example: User Story 1

```bash
# Depois de T004 e T005 (queries.ts e actions.ts) prontos:
Task: "Criar formulario-criar-tipo-sessao.tsx em src/app/painel/pacotes/formulario-criar-tipo-sessao.tsx"
Task: "Criar formulario-criar-tipo-pacote.tsx em src/app/painel/pacotes/formulario-criar-tipo-pacote.tsx"

# Testes da US1, todos em paralelo:
Task: "actions.test.ts em src/app/painel/pacotes/actions.test.ts"
Task: "queries.test.ts em src/app/painel/pacotes/queries.test.ts"
Task: "queries.integration.test.ts em src/app/painel/pacotes/queries.integration.test.ts"
Task: "page.test.tsx em src/app/painel/pacotes/page.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (schema + migration — bloqueia tudo)
3. Completar Phase 3: US1 (catálogo)
4. Completar Phase 4: US2 (vincular/marcar/desfazer)
5. **PARAR e VALIDAR**: rodar `npm run test`, `npm run test:integration`, e os passos 1-8 do `quickstart.md` — esse é o MVP (cadastrar pacote, vincular a uma cliente nova, acompanhar e marcar sessões).

### Incremental Delivery

1. Setup + Foundational → base pronta.
2. US1 → testar isoladamente → catálogo utilizável.
3. US2 → testar isoladamente → MVP completo, já entrega valor de uso diário.
4. US3 → testar isoladamente → renovação segura (com confirmação) liberada.
5. US4 → testar isoladamente → histórico completo liberado.
6. Polish → lint/typecheck/quickstart completo, mensagens de erro revisadas.

---

## Phase 8: Editar/excluir/reativar catálogo (pós-lançamento, a pedido do usuário)

**Contexto**: depois do MVP em produção, o usuário perguntou se dava pra editar/excluir tipos de sessão e pacote (US1 só tinha criar). Duas decisões de design foram resolvidas com o usuário antes de implementar: exclusão de algo **já usado** em qualquer ciclo (de qualquer cliente, ativo ou arquivado) arquiva (`ativo: false`) em vez de apagar; exclusão de algo **nunca usado** apaga de verdade. Ver spec.md FR-015 a FR-018 e Acceptance Scenarios 3–6 da US1 (adicionados retroativamente).

- [X] T038 Adicionar campo `ativo Boolean @default(true)` a `TipoSessao` e `TipoPacote` em `prisma/schema.prisma`; migration `20260927010759_pacotes_catalogo_ativo` aplicada (dev + teste) e client gerado.
- [X] T039 Implementar em `src/app/painel/pacotes/actions.ts`: `editarTipoSessao`, `excluirTipoSessao` (arquiva se em uso em `ItemTipoPacote`/`ItemCicloPacote`/`SessaoRealizada`, senão apaga), `reativarTipoSessao`, `editarTipoPacote` (substitui composição numa transação — seguro por FR-013), `excluirTipoPacote` (arquiva se em uso em `CicloPacote`, senão apaga), `reativarTipoPacote`.
- [X] T040 [P] Criar `src/app/painel/pacotes/formulario-editar-tipo-sessao.tsx` e `formulario-editar-tipo-pacote.tsx`.
- [X] T041 [P] Criar `src/app/painel/pacotes/linha-tipo-sessao.tsx` e `linha-tipo-pacote.tsx` (toggle editar; `BotaoComConfirmacao` pra excluir; botão simples pra reativar); atualizar `page.tsx` para usá-los e filtrar só `ativo: true` nas opções passadas aos formulários de criar/vincular (incluindo `membros/[membroId]/page.tsx`).
- [X] T042 Estender `src/components/botao-com-confirmacao.tsx` com prop `disabled` opcional (retrocompatível) — necessário pro botão "Renovar pacote" da US3, não usado antes desta fase.
- [X] T043 [P] Testes unitários das 6 novas actions em `actions.test.ts` (18 casos: acesso, validação, arquivar-vs-apagar nos dois sentidos) e do fluxo editar/excluir/reativar em `page.test.tsx` (9 casos, com `aria-label` específico por entidade pra evitar ambiguidade entre botões "Editar"/"Excluir"/"Reativar" de tipo de sessão vs. tipo de pacote).
- [X] T044 [P] Teste de integração em `src/app/painel/pacotes/actions.integration.test.ts` (banco real): apaga de verdade quando nunca usado; arquiva quando em uso (tipo de sessão via `ItemTipoPacote`; tipo de pacote via `CicloPacote`, com o ciclo da cliente permanecendo intacto); editar composição não afeta ciclo já criado (FR-013).
- [X] T045 Corrigido bug real descoberto ao rodar a suíte completa: `membros/[membroId]/page.tsx` já filtrava `tiposPacote` por `ativo`, mas os mocks antigos de `listarTiposPacote` em `page.test.tsx` (US3) não tinham o campo `ativo` — `undefined` era tratado como "não ativo", esvaziando o seletor e quebrando 2 testes de "Renovar pacote". Mocks corrigidos com `ativo: true`.

Doc atualizados nesta fase: `spec.md` (FR-015–018, Acceptance Scenarios 3–6 da US1, Key Entities, Assumptions), `data-model.md` (campo `ativo`, regra de exclusão), `contracts/actions.md` (6 novas actions + nota sobre `listarTiposSessao`/`listarTiposPacote` retornarem tudo e quem chama filtrar).

## Notes

- [P] = arquivos diferentes, sem dependência entre si.
- [Story] mapeia a tarefa à user story correspondente, para rastreabilidade.
- Nenhuma tarefa é considerada concluída sem saída real de teste passando (Princípio I da constituição) — não vale "deveria passar".
- Commits em Conventional Commits, sem trailer `Co-Authored-By` (constituição, § Fluxo de Trabalho e Commits); um commit por tarefa ou grupo lógico de tarefas.
- Nenhuma tarefa desta lista refatora Desafios ou qualquer área fora do escopo desta feature (Princípio IV).
