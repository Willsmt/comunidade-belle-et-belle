---

description: "Task list template for feature implementation"
---

# Tasks: Protocolo Completo de Medidas com Leitura por Parceria

**Input**: Design documents from `/specs/003-medidas-parcerias/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/actions.md, quickstart.md (todos lidos e considerados)

**Tests**: incluídos em cada fase — o Princípio I da constituição (`.specify/memory/constitution.md`) exige model → migration → serializer → view/permissão → **TESTES** → commit, e proíbe considerar qualquer tarefa concluída sem saída real de execução de teste passando (`npm run test` / `npm run test:integration`).

**Organization**: tarefas agrupadas por user story (spec.md). US1 (cliente registra) e US2 (parceria lê) são independentes entre si depois do Foundational — cada uma só depende do schema novo, não uma da outra (diferente de outras features deste repositório onde havia corrente sequencial real). US3 (isolamento por vínculo) reaproveita o mesmo código/arquivo de US2 (o gate já é checado a cada chamada por construção — research.md Decisão 6) e existe só para comprovar, via teste explícito, os casos negativos/de isolamento — mesmo padrão já usado na feature anterior deste repositório para uma story de não-regressão.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivo diferente, sem dependência de tarefa incompleta)
- **[Story]**: a qual user story a tarefa pertence (US1, US2, US3)
- Caminhos de arquivo exatos em cada descrição

## Path Conventions

Aplicação Next.js (App Router) já existente — sem `backend/`/`frontend/` separados. Caminhos conforme `plan.md` § Project Structure: `prisma/schema.prisma`, `src/app/cliente/medidas/`, `src/app/parceria/medidas/` (novo), `src/app/parceria/layout.tsx`.

---

## Phase 1: Setup

**Purpose**: confirmar baseline antes de tocar em código — este projeto já tem toda a infraestrutura necessária (Prisma, Vitest, Next.js); não há dependência nova a instalar.

- [X] T001 Confirmar baseline verde antes de iniciar: `npm run lint`, `npm run typecheck`, `npm run test` sem erros pré-existentes bloqueando a feature (nenhum arquivo novo nesta tarefa).

**Checkpoint**: baseline verificado — pronto para o schema da feature.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: schema de banco compartilhado por todas as user stories. Nenhuma story pode começar antes desta fase.

**⚠️ CRITICAL**: bloqueia US1, US2 e US3.

- [X] T002 Em `prisma/schema.prisma`, no model `RegistroMedida` (ver data-model.md): adicionar `altura Decimal? @db.Decimal(5, 2)`; adicionar os três campos de tronco novos `ombro Decimal? @db.Decimal(5, 2)`, `peitoBusto Decimal? @db.Decimal(5, 2)`, `abdomen Decimal? @db.Decimal(5, 2)` (mantendo `cintura`/`quadril` existentes intocados); adicionar os catorze campos bilaterais de membro, todos `Decimal? @db.Decimal(5, 2)`: `bracoDireito`, `bracoEsquerdo`, `antebracoDireito`, `antebracoEsquerdo`, `punhoDireito`, `punhoEsquerdo`, `coxaDireita`, `coxaEsquerda`, `joelhoDireito`, `joelhoEsquerdo`, `panturrilhaDireita`, `panturrilhaEsquerda`, `tornozeloDireito`, `tornozeloEsquerdo`. **Não** remover, renomear nem alterar `braco`/`coxa` existentes (research.md Decisão 4) — só adicionar campos.
- [X] T003 Rodar `npm run db:migrate` (gera e aplica a migration dos 17 campos de T002) e `npm run db:generate` (atualiza `@prisma/client`); confirmar saída sem erro antes de seguir (depende de T002).

**Checkpoint**: schema pronto — US1, US2 e US3 podem começar.

---

## Phase 3: User Story 1 - Cliente registra o protocolo completo de medidas (Priority: P1)

**Goal**: a cliente registra, em `/cliente/medidas`, peso, altura, as cinco medidas de tronco e as sete medidas de membro (lado direito/esquerdo separados), sem mudar o fluxo já existente.

**Independent Test**: a cliente abre `/cliente/medidas`, preenche os campos novos (incluindo valores diferentes para o lado direito e esquerdo de uma medida de membro), salva, e confirma que o registro aparece no histórico com todos os valores preservados; um registro antigo (só com `braco`/`coxa`) continua aparecendo sem erro.

### Implementation for User Story 1

- [X] T004 [US1] Em `src/app/cliente/medidas/actions.ts`: `CAMPOS_MEDIDA` passa a listar os 20 campos aceitos pelo formulário — `peso`, `altura`, `ombro`, `peitoBusto`, `cintura`, `abdomen`, `quadril`, `bracoDireito`, `bracoEsquerdo`, `antebracoDireito`, `antebracoEsquerdo`, `punhoDireito`, `punhoEsquerdo`, `coxaDireita`, `coxaEsquerda`, `joelhoDireito`, `joelhoEsquerdo`, `panturrilhaDireita`, `panturrilhaEsquerda`, `tornozeloDireito`, `tornozeloEsquerdo` — **removendo** `braco`/`coxa` da lista (o formulário novo não escreve mais neles — research.md Decisão 4). A validação "ao menos uma medida preenchida" (`AppError("Preencha ao menos uma medida")`) continua igual, só sobre a lista maior.
- [X] T005 [P] [US1] Em `src/app/cliente/medidas/formulario-registro.tsx`: adicionar um campo `Input type="number" step="0.01"` para `altura` (ao lado de `peso`); adicionar um grupo "Tronco" com `ombro`, `peitoBusto`, `abdomen` (além de `cintura`/`quadril` já existentes); adicionar um grupo "Membros" com um par de inputs lado a lado (rótulos "D"/"E") para cada uma das sete medidas — `name`s `bracoDireito`/`bracoEsquerdo`, `antebracoDireito`/`antebracoEsquerdo`, `punhoDireito`/`punhoEsquerdo`, `coxaDireita`/`coxaEsquerda`, `joelhoDireito`/`joelhoEsquerdo`, `panturrilhaDireita`/`panturrilhaEsquerda`, `tornozeloDireito`/`tornozeloEsquerdo`. Nenhum campo obrigatório individualmente.
- [X] T006 [P] [US1] Em `src/app/cliente/medidas/grafico-evolucao.tsx`: `PontoEvolucao` ganha `ombro`, `peitoBusto`, `abdomen` (tronco novos) e `antebraco`, `punho`, `joelho`, `panturrilha`, `tornozelo` (membro novos, todos `number | null`) — `peso`, `cintura`, `quadril`, `braco`, `coxa` continuam existindo no tipo, sem mudança de nome. Adicionar uma `<Line>` (`connectNulls`, cor `--chart-N` seguindo a sequência já usada) para cada um dos 8 campos novos, com o mesmo padrão das linhas existentes (`type="monotone"`, `name` em português com unidade "(cm)"). `altura` **não** entra no gráfico (research.md Decisão 8).
- [X] T007 [US1] Em `src/app/cliente/medidas/page.tsx`: no histórico, exibir todos os campos novos preenchidos por registro (rótulos em português, unidade "cm"/"kg"), mostrando "—" quando um campo (incluindo um só lado de uma medida de membro) não está preenchido — nunca como zero; ao montar `pontosGrafico`, exportar e usar uma função `valorMembro(direito: number | null, esquerdo: number | null, legado: number | null = null): number | null` (research.md Decisão 8: média se os dois existem, o lado que existe se só um existe, `legado` como último fallback, `null` senão) para calcular `braco: valorMembro(medida.bracoDireito?.toNumber() ?? null, medida.bracoEsquerdo?.toNumber() ?? null, medida.braco?.toNumber() ?? null)` e o mesmo padrão para `coxa` (com `medida.coxa`); para as outras 5 medidas de membro, chamar `valorMembro` sem o terceiro argumento; as 5 medidas de tronco continuam mapeadas direto, sem `valorMembro` (depende de T006 para o tipo `PontoEvolucao`).

### Tests for User Story 1

- [X] T008 [P] [US1] `src/app/cliente/medidas/actions.test.ts` (Prisma mockado): `criarRegistroMedida` persiste todos os 20 campos novos quando informados no `FormData`; a regra "ao menos uma medida preenchida" continua rejeitando um envio totalmente vazio e aceitando quando só um dos 20 campos vem preenchido; o `data` passado a `prisma.registroMedida.create` **não** inclui `braco`/`coxa` (regressão de escopo — research.md Decisão 4).
- [X] T009 [P] [US1] `src/app/cliente/medidas/page.test.tsx`: um registro "antigo" (mock só com `braco`/`coxa` preenchidos, campos novos `null`) renderiza no histórico com os campos novos como "—", sem erro; um registro novo com `bracoDireito`/`bracoEsquerdo` (ou qualquer par D/E) com valores diferentes renderiza os dois lados distintamente; um registro com só um lado de uma medida preenchido mostra "—" no lado ausente (não "0"). Testar `valorMembro` (exportada de `./page`) direto nos 4 ramos: os dois lados preenchidos (retorna a média), só um lado (retorna esse valor), nenhum lado mas com `legado` (retorna o legado), nenhum dos três (retorna `null`).
- [X] T010 [P] [US1] `src/app/cliente/medidas/queries.integration.test.ts` (banco de teste real): inserir via `prisma.registroMedida.create` direto um registro só com `braco`/`coxa` (simulando dado anterior a esta feature) e confirmar que `listarMedidas` devolve sem erro, com os campos novos `null`; chamar `criarRegistroMedida` com valores assimétricos de lado (ex.: `bracoDireito` ≠ `bracoEsquerdo`) e confirmar que o registro persistido no banco preserva os dois valores separadamente.

**Checkpoint**: US1 completa e testável de forma independente — histórico expandido disponível para a US2 ler.

---

## Phase 4: User Story 2 - Parceria vinculada consulta o histórico de medidas de uma cliente (Priority: P1)

**Goal**: uma parceria com vínculo ativo acessa, em `/parceria/medidas`, a lista de clientes vinculadas e, a partir dela, o histórico completo (somente leitura) de medidas de uma cliente escolhida.

**Independent Test**: com uma cliente vinculada que já tem registros de medida (via US1 ou inserção direta em teste), a parceria abre `/parceria/medidas`, escolhe essa cliente, e confirma que vê o histórico completo dela, sem nenhuma opção de criar/editar/excluir.

### Implementation for User Story 2

- [X] T011 [P] [US2] Criar `src/app/parceria/medidas/queries.ts`: `export { listarClientesVinculadas } from "../planos/queries";` — reaproveitamento literal, sem nova implementação (research.md Decisão 7).
- [X] T012 [US2] Criar `src/app/parceria/medidas/page.tsx`: chama `listarClientesVinculadas()`; renderiza uma lista com uma `Card` por cliente (`name ?? email`) linkando para `/parceria/medidas/${cliente.id}`; estado vazio ("Nenhuma cliente vinculada a você ainda.") quando a lista estiver vazia — mesmo texto/padrão de `/parceria/planos` (depende de T011).
- [X] T013 [P] [US2] Criar `src/app/parceria/medidas/[clienteId]/queries.ts`: `obterMedidasDaCliente(clienteId: string)` — chama `requererPapel(["PARCERIA"])`; busca `prisma.vinculoParceria.findUnique({ where: { clienteId_parceriaId: { clienteId, parceriaId: session.user.id } } })`; lança `AppError("Cliente não vinculada a você")` se não existir ou `ativo: false` (mesma mensagem de `enviarPlano`, `src/app/parceria/planos/actions.ts:33-40` — research.md Decisão 6); busca o `User` (`select: { id: true, name: true, email: true }`) e `prisma.registroMedida.findMany({ where: { clienteId }, orderBy: { data: "desc" } })`; retorna `{ cliente, medidas }`.
- [X] T014 [US2] Criar `src/app/parceria/medidas/[clienteId]/page.tsx`: chama `obterMedidasDaCliente(clienteId)` (do `params`) dentro de um `try`; no `catch`, chama `notFound()` (de `next/navigation`) — nenhuma informação da cliente é exposta quando o acesso é negado. Em caso de sucesso, renderiza o nome da cliente e o histórico completo (mesmos rótulos/formatação de `/cliente/medidas`, incluindo os campos bilaterais D/E), sem nenhum formulário, botão de criar, editar ou excluir (FR-013); estado vazio ("Nenhum registro ainda.") quando `medidas` estiver vazio (depende de T013).
- [X] T015 [P] [US2] Em `src/app/parceria/layout.tsx`: adicionar `{ href: "/parceria/medidas", label: "Medidas das clientes" }` à lista `links` do `SubNav`, ao lado de "Meus planos" e "Meu perfil".

### Tests for User Story 2

- [X] T016 [P] [US2] `src/app/parceria/medidas/page.test.tsx`: lista renderiza uma `Card`/link por cliente vinculada retornada por `listarClientesVinculadas` (mockada); estado vazio quando a lista vier vazia.
- [X] T017 [P] [US2] `src/app/parceria/medidas/[clienteId]/queries.test.ts` (Prisma mockado): `obterMedidasDaCliente` chama `requererPapel(["PARCERIA"])`; quando existe `VinculoParceria` com `ativo: true` para `{ clienteId, parceriaId: session.user.id }`, retorna `{ cliente, medidas }` com `medidas` ordenadas por `data: "desc"`.
- [X] T018 [P] [US2] `src/app/parceria/medidas/[clienteId]/page.test.tsx`: com `obterMedidasDaCliente` mockada retornando dado válido, a página renderiza o nome da cliente e todos os registros (incluindo campos D/E distintos); nenhum elemento de criar/editar/excluir está presente no DOM renderizado; estado vazio quando `medidas` é `[]`.
- [X] T019 [P] [US2] `src/app/parceria/medidas/[clienteId]/queries.integration.test.ts` (banco de teste real): com uma parceria, uma cliente, um `VinculoParceria` `ativo: true` entre elas e registros de medida reais (incluindo campos bilaterais) para essa cliente, `obterMedidasDaCliente` retorna o histórico completo e correto.

**Checkpoint**: US1 + US2 funcionam juntas — parceria já lê o que a cliente registrou.

---

## Phase 5: User Story 3 - Acesso da parceria é isolado por vínculo ativo (Priority: P2)

**Goal**: garantir, de forma explícita, que uma parceria só vê medidas de clientes com vínculo ativo — nunca de uma cliente sem vínculo, nem depois que um vínculo é desativado, nem misturado entre clientes diferentes.

**Independent Test**: com duas clientes (uma vinculada, outra não) à mesma parceria, o acesso só funciona para a vinculada; desativar esse vínculo bloqueia uma tentativa de acesso seguinte.

> Não há implementação nova nesta fase — a checagem de vínculo já é feita a cada chamada de `obterMedidasDaCliente` (T013), por construção (research.md Decisão 6): não existe cache nem estado que precise ser invalidado. Esta fase é a comprovação explícita, via teste, de que essa garantia realmente vale — mesmo padrão já usado na feature anterior deste repositório para uma story de não regressão.

### Tests for User Story 3

- [X] T020 [US3] `src/app/parceria/medidas/[clienteId]/queries.test.ts` (mesmo arquivo de T017 — sequencial): `obterMedidasDaCliente` lança `AppError` quando não existe nenhum `VinculoParceria` para `{ clienteId, parceriaId: session.user.id }`; lança `AppError` quando o vínculo existe mas `ativo: false`; lança `AppError` quando o único vínculo daquela cliente é com uma **outra** parceria (`parceriaId` diferente da sessão).
- [X] T021 [US3] `src/app/parceria/medidas/[clienteId]/queries.integration.test.ts` (mesmo arquivo de T019 — sequencial, banco de teste real): com duas clientes vinculadas (`ativo: true`) à mesma parceria, cada chamada de `obterMedidasDaCliente` retorna só os registros da cliente pedida, nunca misturados com os da outra (isolamento); desativar (`ativo: false`) o vínculo de uma delas e chamar de novo lança `AppError`; reativar (`ativo: true`) o mesmo vínculo faz a chamada seguinte voltar a funcionar.
- [X] T022 [US3] `src/app/parceria/medidas/[clienteId]/page.test.tsx` (mesmo arquivo de T018 — sequencial): com `obterMedidasDaCliente` mockada rejeitando (`AppError`), a página chama `notFound()` e não renderiza nenhum dado da cliente.

**Checkpoint**: US1 + US2 + US3 funcionam juntas — leitura por parceria comprovadamente restrita ao vínculo ativo.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: validação final cobrindo as três user stories juntas.

- [ ] T023 [P] Rodar `npm run lint` e `npm run typecheck` no repositório e corrigir qualquer problema introduzido pela feature.
- [ ] T024 Executar o roteiro de validação manual de `specs/003-medidas-parcerias/quickstart.md` do início ao fim e confirmar cada passo (inclui o gate de papel `CLIENTE`/`PARCERIA` e a checagem de vínculo ativo/inativo).
- [ ] T025 [P] Revisar a mensagem de `AppError` de `obterMedidasDaCliente` ("Cliente não vinculada a você") quanto à clareza para uma usuária não-técnica, ajustando se necessário.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências.
- **Foundational (Phase 2)**: depende de Setup — bloqueia todas as user stories.
- **User Stories (Phase 3-5)**: todas dependem do Foundational.
  - **US1** e **US2** são independentes entre si — cada uma só precisa do schema (Foundational); podem ser feitas em qualquer ordem ou em paralelo.
  - **US3 depende de US2**: reaproveita o mesmo arquivo/função (`[clienteId]/queries.ts`, T013) criado na US2 — suas tarefas são sequenciais às tarefas de teste equivalentes da US2 (T020 após T017; T021 após T019; T022 após T018), não paralelas a elas.
- **Polish (Phase 6)**: depende de todas as user stories estarem completas.

### Within Each User Story

- Model/schema (Foundational) → queries (serializer) → actions/páginas (view/permissão) → componentes de UI → testes → commit (Princípio I da constituição).
- Dentro de um mesmo arquivo, tarefas são sequenciais (não `[P]` entre si) — ex.: T011→T012, T013→T014, T017→T020, T019→T021, T018→T022.

### Parallel Opportunities

- T005 (formulário) e T006 (gráfico) podem ser feitos em paralelo — arquivos diferentes, ambos na US1.
- T011 (queries de lista) e T013 (queries de detalhe) podem ser feitos em paralelo — arquivos diferentes, ambos na US2.
- T015 (link de navegação) pode ser feito em paralelo com qualquer outra tarefa da US2 — arquivo isolado (`layout.tsx`).
- Todos os testes de uma mesma fase, marcados `[P]`, podem rodar em paralelo entre si (arquivos diferentes que não dependem de tarefa incompleta).

---

## Parallel Example: User Story 2

```bash
# Depois de T011/T013 (queries) prontos:
Task: "page.tsx em src/app/parceria/medidas/page.tsx"
Task: "queries.ts em src/app/parceria/medidas/[clienteId]/queries.ts"
Task: "link de navegação em src/app/parceria/layout.tsx"

# Testes da US2, todos em paralelo:
Task: "page.test.tsx em src/app/parceria/medidas/page.test.tsx"
Task: "queries.test.ts em src/app/parceria/medidas/[clienteId]/queries.test.ts"
Task: "page.test.tsx em src/app/parceria/medidas/[clienteId]/page.test.tsx"
Task: "queries.integration.test.ts em src/app/parceria/medidas/[clienteId]/queries.integration.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 ou User Story 2, isoladamente)

Diferente da feature anterior deste repositório, aqui as duas stories P1 são
independentes — qualquer uma das duas já entrega valor sozinha.

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (schema — bloqueia tudo)
3. Completar Phase 3: US1 (cliente registra o protocolo completo) **ou** Phase 4: US2 (parceria lê) — qualquer uma primeiro
4. **PARAR e VALIDAR**: rodar `npm run test`, `npm run test:integration`, e a parte correspondente do `quickstart.md`.

### Incremental Delivery

1. Setup + Foundational → base pronta.
2. US1 → testar isoladamente → cliente já registra o protocolo completo (valor imediato, mesmo sem nenhuma parceria olhar ainda).
3. US2 → testar isoladamente → parceria já lê o histórico (usa dado real de US1 ou dado semeado direto em teste).
4. US3 → testar isoladamente → isolamento por vínculo comprovado por teste explícito.
5. Polish → lint/typecheck/quickstart completo, mensagem de erro revisada.

---

## Notes

- `[P]` = arquivos diferentes, sem dependência entre si.
- `[Story]` mapeia a tarefa à user story correspondente, para rastreabilidade.
- Nenhuma tarefa é considerada concluída sem saída real de teste passando (Princípio I da constituição) — não vale "deveria passar".
- Commits em Conventional Commits, sem trailer `Co-Authored-By` (constituição, § Fluxo de Trabalho e Commits); um commit por tarefa ou grupo lógico de tarefas.
- T006/T007 tocam `grafico-evolucao.tsx`/`page.tsx` para a regra de agregação fechada em research.md Decisão 8 — não é escopo adicional: está documentada em plan.md como parte desta feature.
- Nenhuma tarefa desta lista toca Desafios, Pacotes de Sessões ou Feed (Princípio IV).
