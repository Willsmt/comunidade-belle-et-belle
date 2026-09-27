# Quickstart: Comprovação de Foto por Critério de Desafio

Guia de validação manual e automatizada end-to-end desta feature. Para o
contrato completo das actions/queries, ver [contracts/actions.md](contracts/actions.md);
para o schema, ver [data-model.md](data-model.md).

## Pré-requisitos

- Migration da feature aplicada: `npm run db:migrate` (adiciona `exigeFoto` em
  `ItemDesafio` e `fotoChave`/`validado`/`validadoPor`/`validadoEm` em
  `MarcacaoItem`).
- `npm run db:generate` (client do Prisma atualizado).
- Usuário `ADMIN`/`GESTORA` (acesso ao painel), uma cliente (`CLIENTE`), um
  `Desafio` ativo com pelo menos uma `CategoriaDesafio` e um `DesafioSurpresa`
  com `exigeComprovacao: true` já cadastrados (para testar a fila unificada).
- Bucket R2 configurado (mesmas envs já usadas por evolução/desafio surpresa).

## Validação manual (fluxo completo)

1. `npm run dev`, logar como `ADMIN`/`GESTORA`.
2. Em **Painel → Desafios → [desafio]**, criar um item novo (ex.: "Ida à
   academia") marcando o checkbox "Exige foto". Confirmar que ele aparece
   indicado como "exige foto" na lista, enquanto os demais itens do desafio
   continuam sem a marcação (US1, Acceptance Scenario 1 e 3).
3. Num item já existente sem "exige foto", clicar no botão de alternância e
   confirmar que ele passa a exigir foto sem alterar marcações já feitas
   anteriormente para esse item (US1, Acceptance Scenario 2).
4. Logar como a `CLIENTE`, ir em **Desafios**. Tentar marcar o item "Ida à
   academia" (exige foto): confirmar que o formulário pede uma foto e que
   tentar enviar sem anexar nada é bloqueado (US2, Acceptance Scenario 1).
5. Enviar uma foto válida. Confirmar que o item aparece como "aguardando
   aprovação" e que o ranking da cliente **não** inclui os pontos desse item
   (US2, Acceptance Scenario 2; FR-004).
6. Tentar marcar esse mesmo item de novo no mesmo dia — confirmar bloqueio,
   igual à regra já existente de marcação duplicada (US2, Acceptance Scenario 3;
   FR-006).
7. Marcar, no mesmo desafio, um item **sem** "exige foto" e confirmar que ele
   soma ponto na hora, sem pedir foto e sem passar por aprovação (US4).
8. Logar de volta como `ADMIN`/`GESTORA`, ir em **Painel → Aprovações**.
   Confirmar que a comprovação do item pendente aparece **junto** com a
   participação pendente do desafio surpresa `exigeComprovacao: true`, na
   mesma fila, cada uma com a foto visível antes de decidir (US3, Acceptance
   Scenario 1; FR-007, FR-008).
9. Aprovar a comprovação do item. Confirmar: pontos do item passam a contar no
   ranking da cliente; a foto some do bucket R2 (checar via console/CLI do R2
   ou log de `deletarObjeto`) (US3, Acceptance Scenario 2; FR-009).
10. Voltar como cliente, marcar um item com "exige foto" de novo, e do lado do
    painel **rejeitar** essa comprovação. Confirmar: a marcação some por
    completo (a cliente não aparece com pontos nem com marcação daquele dia);
    a foto some do R2; a cliente consegue marcar o item de novo no mesmo dia,
    enviando uma nova foto (US3, Acceptance Scenario 3 e 4; FR-010, FR-011).
11. Repetir aprovar/rejeitar para a participação de desafio surpresa a partir
    da mesma tela `/painel/aprovacoes`, confirmando que `painel/desafios/[id]`
    não tem mais os botões de decisão (só o histórico com badge de status).

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
- Item com `exigeFoto` não soma ponto no ranking enquanto `validado: false`
  (FR-004); item sem `exigeFoto` soma na hora, sem regressão (FR-005).
- `alternarMarcacao` rejeita itens com `exigeFoto: true` (deve usar
  `marcarItemComFoto`).
- `marcarItemComFoto` exige arquivo, respeita a constraint de uma marcação por
  item/cliente/dia (FR-006), e não concede ponto até aprovação.
- `aprovarMarcacaoItem` libera o ponto, apaga a foto do R2, e dispara
  `verificarConquistasBonus`/`verificarConquistasRankingSemanal` com a data
  original da marcação (research.md Decisão 7).
- `rejeitarMarcacaoItem` apaga a foto do R2 e a linha por completo; cliente
  pode marcar de novo depois (FR-010, FR-011).
- `aprovarParticipacao`/`rejeitarParticipacao` (desafio surpresa) também
  apagam a foto do R2 agora (research.md Decisão 3 — comportamento novo em
  código existente).
- `calcularRankingParaConquista`/`regraSatisfeitaHoje` (bônus/emblemas) não
  contam `MarcacaoItem` com `validado: false` (research.md Decisão 4).
- `/painel/aprovacoes` lista comprovações de item e participações de desafio
  surpresa pendentes juntas (FR-007); `listarPendentes` (contas) continua
  funcionando sem regressão.
- Gate de acesso: `alternarExigeFoto`, `aprovarMarcacaoItem`,
  `rejeitarMarcacaoItem` exigem `requererAcessoPainel()`; `marcarItemComFoto`
  exige papel `CLIENTE`.
