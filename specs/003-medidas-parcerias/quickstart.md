# Quickstart: Protocolo Completo de Medidas com Leitura por Parceria

Guia de validação manual e automatizada end-to-end desta feature. Para o
contrato completo das actions/queries, ver [contracts/actions.md](contracts/actions.md);
para o schema, ver [data-model.md](data-model.md).

## Pré-requisitos

- Migration da feature aplicada: `npm run db:migrate` (adiciona `altura` +
  5 campos de tronco + 14 campos bilaterais de membro em `RegistroMedida`;
  `braco`/`coxa` continuam existindo, sem migração de dado).
- `npm run db:generate` (client do Prisma atualizado).
- Uma cliente (`CLIENTE`) com pelo menos um registro de medida **anterior** a
  esta feature (pra validar não-regressão do histórico antigo).
- Uma parceria (`PARCERIA`) com um `VinculoParceria` ativo com essa cliente
  (mesmo fluxo já existente de vínculo, sem mudança nesta feature) e, se
  possível, uma segunda cliente **sem** vínculo com essa parceria (para
  validar o bloqueio de acesso).

## Validação manual (fluxo completo)

1. `npm run dev`, logar como a `CLIENTE`.
2. Em **Minhas medidas** (`/cliente/medidas`), confirmar que o registro
   antigo (criado antes da migration) continua aparecendo no histórico, com
   os campos novos em branco (não como zero) (US1; FR-006; SC-002).
3. Preencher um novo registro com peso, altura, as cinco medidas de tronco e
   pelo menos uma medida de membro com valores **diferentes** para o lado
   direito e o esquerdo (ex.: braço direito 30cm, braço esquerdo 28cm).
   Salvar e confirmar que o registro aparece no histórico com os dois valores
   preservados separadamente (US1, Acceptance Scenario 2).
4. Preencher outro registro informando só um lado de uma medida de membro
   (ex.: só o joelho direito). Salvar e confirmar que o lado não informado
   aparece em branco, não como zero (US1, Acceptance Scenario 3).
5. Tentar salvar um registro sem preencher nenhum campo — confirmar que o
   sistema bloqueia, mesma regra de hoje (US1, Acceptance Scenario 4; FR-004).
6. Logar como a `PARCERIA` vinculada. Ir em **Medidas das clientes**
   (`/parceria/medidas`). Confirmar que a cliente do passo 2–5 aparece na
   listagem (mesma listagem já usada em "Meus planos").
7. Abrir o histórico dessa cliente. Confirmar que todos os registros
   aparecem — o antigo (passo 2) e os novos (passos 3–4) — com todos os
   campos preenchidos, incluindo a distinção entre lado direito/esquerdo, e
   **sem** nenhum botão de criar/editar/excluir na tela (US2, Acceptance
   Scenario 1 e 2; FR-008, FR-013).
8. Se houver uma segunda cliente sem vínculo com essa parceria: tentar
   acessar o histórico dela (inclusive direto pela URL, trocando o id na
   rota) e confirmar que o acesso é negado (US3, Acceptance Scenario 1;
   FR-010).
9. Desativar o vínculo da primeira cliente (fluxo já existente de gestão de
   vínculo) e tentar acessar o histórico dela de novo — confirmar bloqueio
   (US3, Acceptance Scenario 2; FR-011). Reativar o vínculo e confirmar que o
   acesso volta a funcionar.
10. Com uma cliente vinculada que ainda não tem nenhum registro de medida,
    confirmar que a tela de histórico mostra um estado vazio claro, sem erro
    (US2, Acceptance Scenario 3).

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
- `criarRegistroMedida` aceita e persiste os 20 campos novos, mantendo a
  regra "ao menos uma medida preenchida" sobre a lista expandida (FR-001 a
  FR-004).
- Um registro criado antes da migration continua legível por `listarMedidas`
  sem erro e sem perda de campo (FR-006).
- `obterMedidasDaCliente` retorna o histórico completo quando existe
  `VinculoParceria` ativo para aquele `clienteId`/`parceriaId` (FR-008,
  FR-009).
- `obterMedidasDaCliente` lança `AppError` quando não existe vínculo, quando
  o vínculo existe mas está `ativo: false`, e quando o vínculo é de uma
  parceria diferente da da sessão (FR-010, FR-011; US3).
- `obterMedidasDaCliente` exige papel `PARCERIA` (`requererPapel`) antes de
  qualquer consulta ao vínculo ou às medidas.
- `/parceria/medidas` lista as mesmas clientes que `/parceria/planos` já
  lista hoje (reaproveitamento de `listarClientesVinculadas`, sem duplicar
  query).
- Nenhuma action de escrita de `RegistroMedida` é exposta em
  `src/app/parceria/medidas/` (FR-013) — cobertura por ausência: os testes de
  contrato dessa pasta cobrem só leitura.
