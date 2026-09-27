---

description: "Task list template for feature implementation"
---

# Tasks: Comprovação de Foto por Critério de Desafio

**Input**: Design documents from `/specs/002-comprovacao-foto-desafio/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/actions.md, quickstart.md (todos lidos e considerados)

**Tests**: incluídos em cada fase — o Princípio I da constituição (`.specify/memory/constitution.md`) exige model → migration → serializer → view/permissão → **TESTES** → commit, e proíbe considerar qualquer tarefa concluída sem saída real de execução de teste passando (`npm run test` / `npm run test:integration`).

**Organization**: tarefas agrupadas por user story (spec.md) para permitir implementação e teste independentes de cada uma. US1 → US2 → US3 têm uma dependência sequencial real (cada uma precisa de um artefato criado pela anterior para ter o que testar — a própria spec descreve os testes independentes assim); US4 é uma garantia de não regressão que só faz sentido depois de US2 existir.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivo diferente, sem dependência de tarefa incompleta)
- **[Story]**: a qual user story a tarefa pertence (US1, US2, US3, US4)
- Caminhos de arquivo exatos em cada descrição

## Path Conventions

Aplicação Next.js (App Router) já existente — sem `backend/`/`frontend/` separados. Caminhos conforme `plan.md` § Project Structure: `prisma/schema.prisma`, `src/lib/storage/`, `src/lib/desafios/`, `src/app/painel/desafios/[desafioId]/`, `src/app/painel/aprovacoes/`, `src/app/cliente/desafios/`.

---

## Phase 1: Setup

**Purpose**: confirmar baseline antes de tocar em código — este projeto já tem toda a infraestrutura necessária (Prisma, Vitest, Next.js, R2); não há dependência nova a instalar.

- [X] T001 Confirmar baseline verde antes de iniciar: `npm run lint`, `npm run typecheck`, `npm run test` sem erros pré-existentes bloqueando a feature (nenhum arquivo novo nesta tarefa).

**Checkpoint**: baseline verificado — pronto para o schema da feature.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: schema de banco e pipeline de storage compartilhados por todas as user stories. Nenhuma story pode começar antes desta fase.

**⚠️ CRITICAL**: bloqueia US1, US2, US3 e US4.

- [X] T002 Em `prisma/schema.prisma` (ver `data-model.md`):
  - `ItemDesafio`: adicionar `exigeFoto Boolean @default(false)`.
  - `MarcacaoItem`: adicionar `fotoChave String?`, `validado Boolean @default(true)`, `validadoPor String?`, `validadoEm DateTime?`.
- [X] T003 Rodar `npm run db:migrate` (gera e aplica a migration dos campos de T002) e `npm run db:generate` (atualiza `@prisma/client`); confirmar saída sem erro antes de seguir (depende de T002).
- [X] T004 [P] Criar `src/lib/storage/comprovantes-item-desafio.ts` — cópia estrutural de `src/lib/storage/comprovantes-surpresa.ts` (research.md Decisão 8): `validarArquivo(arquivo: File): void` (mesmos tipos permitidos `image/jpeg`/`image/png`/`image/webp`, mesmo limite de 5MB); `uploadComprovanteItem(arquivo: File, clienteId: string): Promise<string>` (comprime via `comprimirImagem`, chave `comprovantes-item/${clienteId}/${randomUUID()}.webp`, `uploadObjeto`); `export { gerarUrlAssinada }` de `./objetos`; `deletarComprovanteItem(chave: string): Promise<void>` (via `deletarObjeto`).

**Checkpoint**: schema e storage prontos — US1, US2, US3 e US4 podem começar.

---

## Phase 3: User Story 1 - Configurar exigência de foto ao cadastrar um item (Priority: P1)

**Goal**: a Patty marca "exige foto" ao criar um item, e consegue ativar/desativar essa exigência num item já existente, item por item.

**Independent Test**: cadastra ou edita um item, marca "exige foto", salva/aplica, e confirma que só aquele item fica com a exigência ativa — os demais itens do mesmo desafio continuam sem exigência.

### Implementation for User Story 1

- [X] T005 [US1] Em `src/app/painel/desafios/[desafioId]/actions.ts`, `criarItem(categoriaId, formData)`: ler `exigeFoto = formData.get("exigeFoto") === "on"` e incluir no `data` do `prisma.itemDesafio.create` (contracts/actions.md).
- [X] T006 [US1] Em `src/app/painel/desafios/[desafioId]/actions.ts`, adicionar `alternarExigeFoto(itemId: string)`: dentro de `executarAction` + `requererAcessoPainel()`; `AppError` se o item não existir; inverte `exigeFoto` (`update` com `{ exigeFoto: !item.exigeFoto }`, buscando o item com `include: { categoria: true }` primeiro para ter `categoriaId`/`desafioId`); `revalidatePath` de `/painel/desafios/${item.categoria.desafioId}` (depende de T005 por editarem o mesmo arquivo — sequencial).
- [X] T007 [P] [US1] Em `src/app/painel/desafios/[desafioId]/formulario-criar-item.tsx`, adicionar um checkbox `id`/`name="exigeFoto"` ("Exige foto"), desmarcado por padrão, sem alterar os campos existentes.
- [X] T008 [P] [US1] Criar `src/app/painel/desafios/[desafioId]/botao-alternar-exige-foto.tsx` ("use client", `useAcaoComErro`) — mesmo padrão de `botao-reabrir-desafio.tsx`: botão que chama `alternarExigeFoto(itemId)`, rótulo indicando o estado atual (ex.: "Exige foto" quando `false`, "Não exige foto" quando `true`, para alternar).
- [X] T009 [US1] Em `src/app/painel/desafios/[desafioId]/page.tsx`, na lista de itens de cada categoria: mostrar um indicador quando `item.exigeFoto` (ex.: badge "Exige foto") e renderizar `BotaoAlternarExigeFoto` ao lado do botão de remover (depende de T006, T008).

### Tests for User Story 1

- [X] T010 [P] [US1] `src/app/painel/desafios/[desafioId]/actions.test.ts` (Prisma mockado): `criarItem` cria com `exigeFoto: true` quando o campo vem `"on"` e `exigeFoto: false` quando ausente; `alternarExigeFoto` inverte o booleano e rejeita item inexistente; `alternarExigeFoto` rejeita sem `requererAcessoPainel()`.
- [X] T011 [P] [US1] `src/app/painel/desafios/[desafioId]/page.test.tsx`: um item criado com "Exige foto" marcado aparece com o indicador, enquanto os demais itens da mesma categoria não aparecem marcados (Acceptance Scenario 1 e 3); clicar no botão de alternância de um item existente muda o indicador exibido, sem precisar de nenhuma tela de edição (Acceptance Scenario 2).
- [X] T012 [P] [US1] `src/app/painel/desafios/[desafioId]/actions.integration.test.ts` (banco de teste real): criar item com `exigeFoto: true`, chamar `alternarExigeFoto` duas vezes e confirmar que o valor persistido no banco alterna corretamente a cada chamada.

**Checkpoint**: US1 completa e testável de forma independente — item com "exige foto" disponível para a US2 usar.

---

## Phase 4: User Story 2 - Cliente comprova o item do dia com foto (Priority: P1)

**Goal**: a cliente marca um item que exige foto, anexando uma foto; a marcação fica pendente e seus pontos não somam no ranking (nem em bônus/emblemas) até a aprovação.

**Independent Test**: com um item `exigeFoto: true` (US1), a cliente marca esse item no dia com uma foto anexada e confirma que a marcação fica pendente e os pontos daquele item não aparecem no ranking dela.

### Implementation for User Story 2

- [X] T013 [US2] Em `src/app/cliente/desafios/actions.ts`, `alternarMarcacao(itemId)`: após buscar `item` (já inclui `categoria`), lançar `AppError("Esse item exige comprovação por foto — use o formulário de envio de foto")` se `item.exigeFoto === true`, antes de qualquer criação/remoção de `MarcacaoItem`. Nenhuma outra mudança de comportamento para itens sem `exigeFoto`.
- [X] T014 [US2] Em `src/app/cliente/desafios/actions.ts`, adicionar `marcarItemComFoto(itemId: string, formData: FormData)`: dentro de `executarAction` + `requererPapel(["CLIENTE"])`; busca `item` com `categoria`; `AppError` se `item.exigeFoto === false` ("use a marcação normal"); `AppError` se já existir `MarcacaoItem` para `itemId`/`clienteId`/`obterDataDeHoje()` (FR-006); lê `formData.get("foto")`, `AppError` se não for `File` válido com `size > 0`; `uploadComprovanteItem(arquivo, clienteId)`; `prisma.marcacaoItem.create({ data: { itemId, clienteId, data: hoje, fotoChave, validado: false } })`; **não** chama `verificarConquistasBonus`/`verificarConquistasRankingSemanal` (research.md Decisão 7); `revalidatePath("/cliente/desafios")` (mesmo arquivo de T013 — sequencial; depende de T004 para `uploadComprovanteItem`).
- [X] T015 [US2] Em `src/app/cliente/desafios/queries.ts`: `itensMarcadosHoje` passa de `Set<string>` para `Map<string, { validado: boolean }>` (uma entrada por `MarcacaoItem` de hoje, com seu `validado`); em `calcularRanking`, o `where` de `prisma.marcacaoItem.findMany` ganha `validado: true`, igual ao filtro que `participacoesSurpresa` já usa (contracts/actions.md).
- [X] T016 [P] [US2] Em `src/lib/desafios/conquistas.ts`: `calcularRankingParaConquista` e `regraSatisfeitaHoje` (nos três `prisma.marcacaoItem.count`/`findMany` que somam/contam marcações) passam a filtrar `validado: true` (research.md Decisão 4) — sem mudança de assinatura.
- [X] T017 [P] [US2] Criar `src/app/cliente/desafios/formulario-marcar-item-com-foto.tsx` ("use client") — base no padrão de `formulario-participar-surpresa.tsx`, mais preview local antes do envio (não há precedente de preview client-side no projeto — é novo nesta feature). Como não existe "desfazer" pra cliente nesse fluxo (só a rejeição da Patty reabre a marcação — FR-011), o preview é a única chance de conferir a foto antes de um envio que não pode ser desfeito:
  - `<input type="file" name="foto" accept="image/*">` (sem `required` direto no input — a validação de "tem foto selecionada" passa a ser via estado, para controlar o preview) com `onChange` que guarda o `File` em `useState` e gera `URL.createObjectURL(arquivo)` para uma miniatura exibida acima do botão de confirmar.
  - Ao trocar de arquivo (novo `onChange`) ou desmontar o componente, chamar `URL.revokeObjectURL` da URL de preview anterior antes de criar/descartar a nova (evita vazar `Blob` URL).
  - Um botão "Trocar foto" reabre o seletor de arquivo (reset do `<input>` + novo preview ao escolher outro arquivo).
  - O botão de confirmar/enviar só fica habilitado (ou só aparece) depois que uma foto foi selecionada e está visível no preview; só nesse momento `useAcaoComErro().executar(() => marcarItemComFoto(itemId, formData))` é chamado, com o `FormData` montado a partir do `File` em estado (não do `<input>` diretamente, já que ele pode ter sido resetado pelo "Trocar foto").
- [X] T018 [US2] Em `src/app/cliente/desafios/page.tsx`, na lista de itens: para `item.exigeFoto === true`, usar a entrada de `itensMarcadosHoje` (Map) para decidir entre `FormularioMarcarItemComFoto` (sem marcação hoje), texto "Aguardando aprovação da Patty" (`validado: false`) ou estado "marcado" (`validado: true`); para os demais itens, manter `BotaoMarcarItem` como hoje (depende de T015, T017).

### Tests for User Story 2

- [X] T019 [P] [US2] `src/app/cliente/desafios/actions.test.ts` (Prisma mockado): `marcarItemComFoto` rejeita sem arquivo; rejeita item com `exigeFoto: false`; rejeita marcação duplicada no mesmo dia (FR-006); cria com `validado: false` e `fotoChave` da chave retornada pelo upload em caso de sucesso; `alternarMarcacao` rejeita item com `exigeFoto: true`, orientando a usar o outro formulário.
- [X] T020 [P] [US2] `src/app/cliente/desafios/queries.test.ts` (Prisma mockado): `calcularRanking` exclui `MarcacaoItem` com `validado: false` da soma; `itensMarcadosHoje` retorna `validado` correto para uma marcação pendente e uma aprovada.
- [X] T021 [P] [US2] `src/lib/desafios/conquistas.test.ts`: `regraSatisfeitaHoje` (limiar diário, combo, categoria completa) não considera `MarcacaoItem` com `validado: false` satisfeita/contada; `calcularRankingParaConquista` exclui marcações pendentes da pontuação usada para emblemas de ranking.
- [X] T022 [P] [US2] `src/app/cliente/desafios/queries.integration.test.ts` (banco de teste real): cliente marca item `exigeFoto: true` via `marcarItemComFoto` (upload mockado/stubado) → `MarcacaoItem` criada com `validado: false`; ranking calculado não inclui os pontos desse item; segunda tentativa de marcar o mesmo item no mesmo dia é bloqueada pela constraint (FR-006).
- [X] T023 [P] [US2] `src/app/cliente/desafios/page.test.tsx`: item com `exigeFoto` sem marcação hoje mostra o formulário de envio de foto; depois de marcado (pendente), mostra "Aguardando aprovação da Patty" em vez do formulário ou de um botão de marcar.
- [X] T024 [P] [US2] Criar `src/app/cliente/desafios/formulario-marcar-item-com-foto.test.tsx` (`@vitest-environment jsdom`, mesmo padrão de `fotos-jornada.test.tsx`: `render`/`fireEvent`/`vi.mock("./actions")`) — mockar `URL.createObjectURL`/`URL.revokeObjectURL` com `vi.fn()` (jsdom não implementa de verdade) e cobrir: selecionar um arquivo no `<input type="file">` faz o preview (`<img>`) aparecer com a URL retornada por `createObjectURL`; selecionar um segundo arquivo (via "Trocar foto") atualiza o preview para a nova URL e chama `revokeObjectURL` com a URL anterior; sem nenhum arquivo selecionado, o botão de confirmar não está habilitado/visível; depois de selecionado, confirmar chama `marcarItemComFoto` com um `FormData` contendo o arquivo escolhido.

**Checkpoint**: US1 + US2 funcionam juntas — cliente já consegue gerar uma comprovação pendente para a US3 decidir.

---

## Phase 5: User Story 3 - Patty aprova ou rejeita a comprovação (Priority: P1) 🎯 fecha o ciclo

**Goal**: a Patty decide, numa fila única em `/painel/aprovacoes`, as comprovações de item e as participações de desafio surpresa pendentes — aprovar libera o ponto e apaga a foto do R2; rejeitar apaga o registro e libera a cliente para marcar de novo.

**Independent Test**: com uma comprovação de item pendente (US2) e uma participação de desafio surpresa pendente já existentes, a Patty abre `/painel/aprovacoes`, vê as duas juntas, aprova uma (ponto libera, foto some do R2) e rejeita a outra (registro some, cliente pode marcar/participar de novo).

### Implementation for User Story 3

- [X] T025 [P] [US3] Em `src/app/painel/desafios/[desafioId]/actions.ts`, `aprovarParticipacao`/`rejeitarParticipacao`: antes de atualizar/deletar, buscar a `participacao` (já ocorre); se `fotoChave` existir, chamar `deletarComprovante(fotoChave)` (de `comprovantes-surpresa.ts`) em ambas; acrescentar `revalidatePath("/painel/aprovacoes")` além do path já revalidado (research.md Decisão 3).
- [X] T026 [P] [US3] Em `src/app/painel/desafios/[desafioId]/page.tsx`: remover `BotaoAprovarParticipacao` e a confirmação de "Rejeitar" da lista de participações — manter só a lista (foto + badge "Pendente"/"Aprovada" via `participacao.validado`), sem ações de decisão ali (research.md Decisão 2).
- [X] T027 [US3] Em `src/app/painel/aprovacoes/actions.ts`, adicionar `aprovarMarcacaoItem(marcacaoId: string)`: dentro de `executarAction` + `requererAcessoPainel()`; busca a `MarcacaoItem` (`include: { item: { include: { categoria: true } } }`); `AppError` se não existir ou já `validado: true`; `update` para `validado: true`, `validadoPor: session.user.id`, `validadoEm: new Date()`, e `fotoChave: null`; se havia `fotoChave`, chama `deletarComprovanteItem(fotoChave)` antes de limpar o campo; chama `verificarConquistasBonus(clienteId, item.categoria.desafioId, marcacao.data)` e `verificarConquistasRankingSemanal(item.categoria.desafioId, marcacao.data)` (research.md Decisão 7, usando a data original da marcação); `revalidatePath("/painel/aprovacoes")` e `revalidatePath("/cliente/desafios")`.
- [X] T028 [US3] Em `src/app/painel/aprovacoes/actions.ts`, adicionar `rejeitarMarcacaoItem(marcacaoId: string)`: `AppError` se não existir; se havia `fotoChave`, `deletarComprovanteItem(fotoChave)`; `prisma.marcacaoItem.delete({ where: { id: marcacaoId } })`; `revalidatePath("/painel/aprovacoes")` e `revalidatePath("/cliente/desafios")` (mesmo arquivo de T027 — sequencial).
- [X] T029 [P] [US3] Em `src/app/painel/aprovacoes/queries.ts`, adicionar `listarComprovacoesPendentes()`: retorna `{ itens, participacoesSurpresa }` — `itens` = `MarcacaoItem` com `validado: false`, incluindo `item` (`descricao`, `pontos`, `categoria: { include: { desafio: { select: { titulo: true } } } }`), `cliente` (`name`, `email`), `fotoUrl` (via `gerarUrlAssinada` de `comprovantes-item-desafio.ts` quando `fotoChave` existir), `orderBy: { criadoEm: "asc" }`; `participacoesSurpresa` = `ParticipacaoSurpresa` com `validado: false`, incluindo `desafioSurpresa` (`titulo`, `pontos`) e `cliente`, com `fotoUrl` via `gerarUrlAssinada` de `comprovantes-surpresa.ts` (mesma forma de `painel/desafios/[desafioId]/queries.ts`).
- [X] T030 [P] [US3] Criar `src/app/painel/aprovacoes/botao-aprovar-marcacao-item.tsx` ("use client", `useAcaoComErro`) — mesmo padrão de `botao-aprovar-conta.tsx`: chama `aprovarMarcacaoItem(marcacaoId)`.
- [X] T031 [US3] Reescrever `src/app/painel/aprovacoes/page.tsx`: buscar `listarPendentes()` (contas), `listarComprovacoesPendentes()` (itens + surpresa) em paralelo (`Promise.all`); renderizar três seções — Contas (como hoje), Comprovações de item (foto + `BotaoAprovarMarcacaoItem` + `BotaoComConfirmacao` "Rejeitar" chamando `rejeitarMarcacaoItem`), Desafio surpresa (foto + `BotaoAprovarParticipacao`, importado de `painel/desafios/[desafioId]/botao-aprovar-participacao.tsx`, + `BotaoComConfirmacao` "Rejeitar" chamando `rejeitarParticipacao`, ambos importados de `painel/desafios/[desafioId]/actions.ts`); estado vazio só quando as três listas estiverem vazias (depende de T027, T028, T029, T030, T025, T026).

### Tests for User Story 3

- [X] T032 [P] [US3] `src/app/painel/desafios/[desafioId]/actions.test.ts`: `aprovarParticipacao`/`rejeitarParticipacao` chamam `deletarComprovante` quando `fotoChave` existe e não chamam quando é `null`; ambas continuam rejeitando sem `requererAcessoPainel()`.
- [X] T033 [P] [US3] `src/app/painel/aprovacoes/actions.test.ts` (Prisma mockado): `aprovarMarcacaoItem` marca `validado: true`, apaga a foto e zera `fotoChave`, chama os dois verificadores de conquista com a data da marcação; rejeita marcação inexistente ou já `validado: true`; `rejeitarMarcacaoItem` apaga foto (quando houver) e a linha; ambas rejeitam sem `requererAcessoPainel()`.
- [X] T034 [P] [US3] `src/app/painel/aprovacoes/queries.test.ts` (Prisma mockado): `listarComprovacoesPendentes` filtra `validado: false` nos dois tipos e monta `fotoUrl` só quando `fotoChave` existe.
- [X] T035 [P] [US3] `src/app/painel/aprovacoes/queries.integration.test.ts` (banco de teste real): com uma `MarcacaoItem` pendente e uma `ParticipacaoSurpresa` pendente, `listarComprovacoesPendentes` retorna as duas; depois de `aprovarMarcacaoItem`, o ranking da cliente passa a incluir os pontos daquele item (Acceptance Scenario 2 da US3); depois de `rejeitarMarcacaoItem`, a cliente consegue marcar o mesmo item de novo no mesmo dia sem bloqueio (Acceptance Scenario 3 e 4 da US3 / FR-010, FR-011).
- [X] T036 [P] [US3] `src/app/painel/aprovacoes/page.test.tsx`: renderiza as três seções (contas, itens, surpresa) juntas quando há pendências dos três tipos; aprovar/rejeitar cada tipo chama a action correta; estado vazio só aparece quando as três listas estão vazias (Acceptance Scenario 1 da US3).
- [X] T037 [P] [US3] `src/app/painel/desafios/[desafioId]/page.test.tsx`: a lista de participações de desafio surpresa não renderiza mais botões de aprovar/rejeitar, só o histórico com badge de status (guarda de regressão para a Decisão 2).

**Checkpoint**: US1 + US2 + US3 funcionam juntas — ciclo completo (configurar → comprovar → decidir) testável de ponta a ponta via `quickstart.md`.

---

## Phase 6: User Story 4 - Itens sem "exige foto" continuam sem trava (Priority: P2)

**Goal**: garantir, de forma explícita, que nenhum item sem "exige foto" foi afetado pelas mudanças das US1-US3 — mesmo comportamento de hoje (ponto na hora, sem foto, sem aprovação).

**Independent Test**: marcar um item sem "exige foto" soma ponto imediatamente no ranking, sem pedir foto e sem passar por aprovação, mesmo num desafio que também tem itens com "exige foto".

### Tests for User Story 4

> Não há implementação nova nesta fase — o comportamento já é preservado por construção (T013 só intercepta itens com `exigeFoto: true`; `validado` nasce `true` por padrão). Esta fase é só a comprovação explícita, via teste, de que não houve regressão.

- [X] T038 [P] [US4] `src/app/cliente/desafios/actions.test.ts`: `alternarMarcacao` num item com `exigeFoto: false` continua criando/removendo a `MarcacaoItem` (toggle) e chamando `verificarConquistasBonus`/`verificarConquistasRankingSemanal` exatamente como antes da feature — nenhuma mudança de comportamento (Acceptance Scenario 1 da US4).
- [X] T039 [P] [US4] `src/app/cliente/desafios/queries.test.ts`: `calcularRanking` continua somando imediatamente uma `MarcacaoItem` de item sem `exigeFoto` (nasce `validado: true` por padrão), lado a lado com uma marcação pendente de outro item sendo corretamente excluída.
- [X] T040 [P] [US4] `src/app/cliente/desafios/page.test.tsx`: desafio com um item `exigeFoto: true` (pendente) e um item `exigeFoto: false` — marcar o item sem exigência soma ponto na hora, sem exibir formulário de foto nem estado de pendência, independente do estado do outro item (Acceptance Scenario 2 da US4).

**Checkpoint**: todas as 4 user stories funcionam de forma independente e testável, sem regressão no caminho existente.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: validação final cobrindo todas as user stories juntas.

- [X] T041 [P] Rodar `npm run lint` e `npm run typecheck` no repositório e corrigir qualquer problema introduzido pela feature.
- [ ] T042 Executar o roteiro de validação manual de `specs/002-comprovacao-foto-desafio/quickstart.md` do início ao fim e confirmar cada passo (inclui o gate de acesso ao papel `CLIENTE` em `marcarItemComFoto` e ao painel nas demais actions novas).
- [X] T043 [P] Revisar as mensagens de `AppError` das actions novas/alteradas (`marcarItemComFoto`, `alternarMarcacao`, `alternarExigeFoto`, `aprovarMarcacaoItem`, `rejeitarMarcacaoItem`) quanto à clareza para uma usuária não-técnica, ajustando onde necessário.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências.
- **Foundational (Phase 2)**: depende de Setup — bloqueia todas as user stories.
- **User Stories (Phase 3-6)**: todas dependem do Foundational; além disso, diferente de outras features deste repositório, aqui há uma dependência sequencial real entre as três primeiras (a própria spec descreve o teste independente de cada uma partindo da anterior):
  - **US2 depende de US1**: precisa de um item com `exigeFoto: true` (T005/T006) para ter o que marcar com foto.
  - **US3 depende de US2**: precisa de uma `MarcacaoItem` pendente (T014) para ter o que aprovar/rejeitar; T027 também depende de T016 (filtro `validado` em `conquistas.ts`) já estar em vigor, para os verificadores de conquista chamados na aprovação se comportarem corretamente.
  - **US4 depende de US2**: são testes de não regressão sobre o mesmo código que a US2 alterou (`alternarMarcacao`, `calcularRanking`); não faz sentido antes disso existir.
- **Polish (Phase 7)**: depende de todas as user stories estarem completas.

### Within Each User Story

- Model/schema (Foundational) → queries (serializer) → actions (view/permissão) → componentes de UI → página → testes → commit (Princípio I da constituição).
- Dentro de cada `actions.ts`, tarefas que editam o mesmo arquivo são sequenciais (não `[P]` entre si) — ex.: T005→T006, T013→T014, T027→T028.

### Parallel Opportunities

- Todos os testes de uma mesma fase, marcados `[P]`, podem rodar em paralelo entre si (arquivos diferentes).
- T007 e T008 (checkbox no formulário vs. botão de alternância, ambos da US1) podem ser feitos em paralelo.
- T016 (conquistas.ts) e T017 (novo formulário) podem ser feitos em paralelo com T015 (queries.ts) — três arquivos diferentes, todos na US2.
- T025/T026 (limpeza de storage do desafio surpresa) e T029/T030 (query + botão novo de item) podem ser feitos em paralelo — arquivos diferentes dentro da US3.

---

## Parallel Example: User Story 2

```bash
# Depois de T013/T014 (actions.ts) prontos:
Task: "Filtrar validado:true em src/lib/desafios/conquistas.ts"
Task: "Criar formulario-marcar-item-com-foto.tsx em src/app/cliente/desafios/formulario-marcar-item-com-foto.tsx"

# Testes da US2, todos em paralelo:
Task: "actions.test.ts em src/app/cliente/desafios/actions.test.ts"
Task: "queries.test.ts em src/app/cliente/desafios/queries.test.ts"
Task: "conquistas.test.ts em src/lib/desafios/conquistas.test.ts"
Task: "queries.integration.test.ts em src/app/cliente/desafios/queries.integration.test.ts"
Task: "page.test.tsx em src/app/cliente/desafios/page.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 + 3)

Diferente de features com stories independentes, aqui as três P1 (US1, US2, US3) formam o ciclo completo — nenhuma sozinha entrega valor de ponta a ponta sem as outras duas.

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (schema + migration + storage — bloqueia tudo)
3. Completar Phase 3: US1 (configurar exigência)
4. Completar Phase 4: US2 (cliente comprova)
5. Completar Phase 5: US3 (Patty decide)
6. **PARAR e VALIDAR**: rodar `npm run test`, `npm run test:integration`, e os passos 1-11 do `quickstart.md` — esse é o ciclo completo (MVP real desta feature).

### Incremental Delivery

1. Setup + Foundational → base pronta.
2. US1 → testar isoladamente → itens com exigência configuráveis (ainda sem efeito visível pra cliente).
3. US2 → testar isoladamente → cliente já comprova com foto e vê pontos bloqueados; falta só a decisão da Patty.
4. US3 → testar isoladamente → ciclo completo liberado (MVP).
5. US4 → testar isoladamente → não regressão confirmada por teste explícito.
6. Polish → lint/typecheck/quickstart completo, mensagens de erro revisadas.

---

## Notes

- `[P]` = arquivos diferentes, sem dependência entre si.
- `[Story]` mapeia a tarefa à user story correspondente, para rastreabilidade.
- Nenhuma tarefa é considerada concluída sem saída real de teste passando (Princípio I da constituição) — não vale "deveria passar".
- Commits em Conventional Commits, sem trailer `Co-Authored-By` (constituição, § Fluxo de Trabalho e Commits); um commit por tarefa ou grupo lógico de tarefas.
- T025/T026 e T016 tocam código de features vizinhas (desafio surpresa; bônus/emblemas de Desafios) — são as duas extensões de escopo sinalizadas em `research.md` (Decisões 3 e 4) e em `plan.md`, não descuido: revertê-las, se a Patty preferir, significa só não aplicar essas duas tarefas.
- Nenhuma tarefa desta lista toca Pacotes de Sessões, Perfil, Parcerias ou qualquer área fora de Desafios/Aprovações (Princípio IV).
