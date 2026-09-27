# Quickstart: Pacotes de Sessões

Guia de validação manual e automatizada end-to-end desta feature. Para o
contrato completo das actions/queries, ver [contracts/actions.md](contracts/actions.md);
para o schema, ver [data-model.md](data-model.md).

## Pré-requisitos

- Migration da feature aplicada: `npm run db:migrate` (adiciona os models
  `TipoSessao`, `TipoPacote`, `ItemTipoPacote`, `CicloPacote`,
  `ItemCicloPacote`, `SessaoRealizada`).
- `npm run db:generate` (client do Prisma atualizado).
- Usuário de teste com papel `ADMIN` ou `GESTORA` (acesso ao painel) e ao menos
  uma cliente (papel `CLIENTE`) cadastrada.

## Validação manual (fluxo completo)

1. `npm run dev`, logar como `ADMIN`/`GESTORA`.
2. Ir em **Painel → Pacotes** (novo item no `SubNav`). Na seção de tipos de
   sessão, cadastrar "Aplicação", "Radiofrequência" e "Ultrassom". Confirmar
   que aparecem na lista (pré-requisito de US1 após a revisão do modelo —
   research.md Decisão 1 revisada).
3. Na seção de tipos de pacote (mesma tela), cadastrar "Projeto Corpo dos
   Sonhos" com: Aplicação × 4, Radiofrequência × 4, Ultrassom × 4 (escolhendo os
   tipos de sessão já cadastrados no passo 2). Confirmar que aparece na lista
   com essa composição (US1).
4. Ir em **Painel → Membros**, abrir o novo link/botão de uma cliente (rota
   `/painel/membros/[membroId]`). Sem ciclo ativo, a tela indica isso
   claramente (US2, Acceptance Scenario 5).
5. Vincular o pacote "Projeto Corpo dos Sonhos" a essa cliente. Como ainda não
   há ciclo ativo, não deve pedir confirmação de substituição. Confirmar
   contadores 0/4, 0/4, 0/4 para os três tipos (US2, Acceptance Scenario 1).
6. Marcar uma sessão de "Aplicação". Confirmar que o contador de Aplicação vai
   para 1/4 e os outros dois tipos continuam em 0/4 (US2, Acceptance Scenario 2).
7. Marcar Aplicação mais 3 vezes (total 4/4). Tentar marcar uma 5ª — confirmar
   bloqueio com mensagem de limite atingido (US2, Acceptance Scenario 3; FR-007).
8. Desfazer uma das marcações de Aplicação. Confirmar volta para 3/4 e que ela
   desaparece do histórico (US2, Acceptance Scenario 4; FR-008).
9. Acionar "Renovar pacote" (ou "Vincular pacote" de novo) para essa cliente,
   escolhendo novamente "Projeto Corpo dos Sonhos" (ou outro tipo cadastrado).
   Como já existe ciclo ativo, confirmar que aparece a confirmação mostrando o
   contador atual (ex.: Aplicação 3/4, Radiofrequência 0/4, Ultrassom 0/4)
   antes de prosseguir (US3, novo Acceptance Scenario 1; FR-014).
   9a. Cancelar a confirmação uma vez e checar que nada mudou (US3, Acceptance
       Scenario 2; FR-014).
   9b. Confirmar de fato e checar: novo ciclo com contadores zerados; o ciclo
       anterior não aparece mais como ativo, mas continua acessível no
       histórico com os dados intactos (US3, Acceptance Scenario 3; FR-009,
       FR-010).
10. Abrir o histórico de sessões dessa cliente. Confirmar que aparecem as
    sessões marcadas tanto no ciclo atual quanto no ciclo arquivado, cada uma
    com tipo e data, indicando a qual ciclo pertence (US4; FR-011).
11. Logar como `CLIENTE` (sem acesso ao painel) e confirmar que
    `/painel/membros/[membroId]`, `/painel/pacotes` e as actions retornam
    "Acesso negado" (FR-012).

## Validação automatizada

Seguindo o Princípio I da constituição — nenhuma tarefa fecha sem output real
de teste passando:

```bash
npm run test              # unit: queries/actions com prisma mockado
npm run test:integration  # integration: contra banco de teste real (vitest.integration.config.mts)
npm run typecheck
npm run lint
```

Cobertura mínima esperada pelos testes (detalhada em `tasks.md`):
- Bloqueio ao exceder quantidade contratada (FR-007).
- No máximo um ciclo ativo por cliente ao vincular/renovar (FR-004, FR-009).
- Desfazer remove a sessão e o contador (calculado) reflete a remoção (FR-008).
- Histórico inclui sessões de ciclos arquivados (FR-011).
- Edição de um `TipoPacote` não altera ciclos já criados (FR-013).
- Gate de acesso ao painel em todas as actions/queries novas (FR-012).
- Cadastro de `TipoSessao` com nome duplicado é rejeitado (constraint `@@unique`
  traduzida em `AppError`).
- `vincularPacote` arquiva o ciclo ativo anterior corretamente quando chamado
  (a confirmação em si, FR-014, é responsabilidade da UI — cobrir com teste de
  componente que o diálogo aparece com o contador certo e que cancelar não
  chama a action).
