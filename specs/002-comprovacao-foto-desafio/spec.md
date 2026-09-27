# Feature Specification: Comprovação de Foto por Critério de Desafio

**Feature Branch**: `002-comprovacao-foto-desafio`

**Created**: 2026-09-26

**Status**: Draft

**Input**: User description: "Comprovação de foto por critério de desafio. Ao criar um item/critério do desafio mensal, a Patty pode marcar \"exige foto\" — opcional, item por item (não é padrão pra todo item, só quando fizer sentido, ex: ida à academia). Quando marcado: ao marcar o item no dia, a cliente sobe uma foto (mesmo pipeline de compressão/R2 já usado em fotos de evolução e desafio surpresa); os pontos daquele item ficam bloqueados — não somam no ranking — até a Patty aprovar. Aprovação/rejeição fica na aba /painel/aprovacoes (unificada com desafio surpresa): aprovar libera os pontos no ranking E apaga a foto do R2, pra não acumular storage; rejeitar deleta o registro da marcação, cliente pode marcar de novo. Itens sem \"exige foto\" continuam contando ponto na hora de marcar, sem trava — comportamento atual inalterado."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configurar exigência de foto ao cadastrar um item (Priority: P1)

Ao criar ou editar um item/critério do desafio mensal, a Patty marca opcionalmente "exige foto" para aquele item específico (ex.: "ida à academia"), sem afetar os demais itens do mesmo desafio.

**Why this priority**: Sem essa configuração não existe nenhum item que dispare o fluxo de comprovação — é o ponto de entrada de toda a feature.

**Independent Test**: Pode ser testado sozinho — a Patty cadastra ou edita um item, marca "exige foto", salva, e confirma que esse item aparece com a exigência ativa enquanto os outros itens do mesmo desafio continuam sem exigência, mesmo sem nenhuma cliente ter marcado nada ainda.

**Acceptance Scenarios**:

1. **Given** a Patty está cadastrando um novo item de desafio, **When** ela marca a opção "exige foto" e salva, **Then** o item é criado com a exigência de foto ativa.
2. **Given** um item de desafio já existente sem "exige foto", **When** a Patty edita o item e ativa a opção, **Then** a exigência passa a valer a partir daquele momento, sem alterar marcações já feitas anteriormente para aquele item.
3. **Given** um desafio com vários itens, **When** a Patty marca "exige foto" em apenas um deles, **Then** os demais itens do mesmo desafio permanecem sem exigência de foto.

---

### User Story 2 - Cliente comprova o item do dia com foto (Priority: P1)

A cliente marca, no dia, um item que exige foto. O sistema pede o envio de uma foto (mesmo pipeline de compressão e armazenamento já usado em fotos de evolução e desafio surpresa) e a marcação fica pendente: os pontos daquele item não entram no ranking até a Patty decidir.

**Why this priority**: É o comportamento central da feature do ponto de vista da cliente — sem isso, marcar "exige foto" no item (US1) não tem efeito nenhum no dia a dia.

**Independent Test**: Com um item configurado como "exige foto" (US1), a cliente marca esse item no dia, anexa uma foto, confirma, e verifica que a marcação aparece como pendente e que os pontos daquele item não aparecem somados no ranking dela.

**Acceptance Scenarios**:

1. **Given** um item do dia que exige foto, **When** a cliente tenta marcar o item sem anexar nenhuma foto, **Then** o sistema impede a conclusão da marcação até que uma foto seja enviada.
2. **Given** um item do dia que exige foto, **When** a cliente marca o item e envia uma foto válida, **Then** a marcação é registrada como pendente de aprovação e os pontos daquele item não são somados ao ranking da cliente.
3. **Given** uma marcação pendente de aprovação para um item que exige foto, **When** a cliente tenta marcar esse mesmo item novamente no mesmo dia, **Then** o sistema bloqueia a nova marcação, do mesmo jeito que já bloqueia hoje uma marcação duplicada no mesmo dia.

---

### User Story 3 - Patty aprova ou rejeita a comprovação (Priority: P1)

A Patty revisa, em /painel/aprovacoes (a mesma aba já usada para aprovar participações de desafio surpresa), as comprovações de itens pendentes. Aprovar libera os pontos daquele item no ranking e apaga a foto do armazenamento. Rejeitar apaga o registro da marcação, permitindo que a cliente marque o item de novo.

**Why this priority**: Fecha o ciclo da feature — sem a decisão da Patty, os pontos ficam bloqueados para sempre e o storage de fotos cresce indefinidamente.

**Independent Test**: Com uma comprovação pendente já existente (US2), a Patty abre /painel/aprovacoes, vê a comprovação do item junto com as pendências de desafio surpresa, aprova uma e confirma que os pontos passam a contar no ranking e a foto some do armazenamento; em outra comprovação pendente, rejeita e confirma que o registro da marcação desaparece e a cliente consegue marcar o item de novo no mesmo dia.

**Acceptance Scenarios**:

1. **Given** comprovações de itens e participações de desafio surpresa pendentes ao mesmo tempo, **When** a Patty abre /painel/aprovacoes, **Then** vê as duas pendências juntas, na mesma fila, podendo revisar a foto de cada uma antes de decidir.
2. **Given** uma comprovação de item pendente, **When** a Patty aprova, **Then** os pontos daquele item passam a somar no ranking da cliente e a foto correspondente é apagada do armazenamento.
3. **Given** uma comprovação de item pendente, **When** a Patty rejeita, **Then** o registro daquela marcação é apagado (a cliente não fica com pontos nem com marcação registrada para aquele dia) e a foto correspondente também é removida do armazenamento.
4. **Given** uma comprovação de item que acabou de ser rejeitada, **When** a cliente volta ao item no mesmo dia, **Then** ela consegue marcá-lo novamente e enviar uma nova foto, como se nunca tivesse marcado.

---

### User Story 4 - Itens sem "exige foto" continuam sem trava (Priority: P2)

Itens de desafio que não têm "exige foto" continuam se comportando exatamente como hoje: a cliente marca e o ponto soma na hora, sem foto e sem aprovação.

**Why this priority**: É uma garantia de não regressão sobre o comportamento existente, não uma capacidade nova — mas precisa ser validada explicitamente porque a mesma tela/ação de marcar item passa a ter dois caminhos possíveis.

**Independent Test**: Com um item sem "exige foto", a cliente marca o item no dia e confirma que o ponto aparece somado no ranking imediatamente, sem qualquer pedido de foto ou estado de pendência.

**Acceptance Scenarios**:

1. **Given** um item de desafio sem "exige foto", **When** a cliente marca esse item no dia, **Then** o ponto é somado ao ranking imediatamente, sem pedir foto e sem passar por aprovação.
2. **Given** um desafio com itens mistos (alguns com "exige foto", outros sem), **When** a cliente marca um item sem exigência logo após marcar um item com exigência, **Then** apenas o item com exigência fica pendente; o item sem exigência já conta ponto normalmente.

---

### Edge Cases

- O que acontece quando a cliente tenta marcar de novo, no mesmo dia, um item que já tem uma comprovação pendente de aprovação? (mesma regra de bloqueio de marcação duplicada já existente hoje)
- O que acontece se a Patty ativar ou desativar "exige foto" em um item que já tem marcações antigas? As marcações já feitas não são recalculadas — a mudança vale só para marcações futuras.
- O que acontece se a cliente tentar concluir a marcação de um item que exige foto sem anexar nenhuma imagem? A marcação não é concluída até uma foto ser enviada.
- O que acontece com a foto enviada quando a Patty rejeita a comprovação? Ela é removida do armazenamento junto com o registro da marcação, para não acumular storage de comprovações recusadas.
- Como a cliente diferencia, olhando o item do dia, entre "marcado e já pontuando", "marcado e aguardando aprovação" e "sem marcação (pode marcar de novo, inclusive após uma rejeição)"?
- O que acontece se um item ou desafio inteiro for excluído/arquivado enquanto existem comprovações pendentes daquele item? O item/desafio segue as mesmas regras de arquivamento já usadas hoje para itens em uso; comprovações pendentes existentes continuam disponíveis para decisão da Patty em /painel/aprovacoes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir que a Patty marque a opção "exige foto" ao criar ou editar um item/critério de desafio, item por item, desmarcada por padrão.
- **FR-002**: A exigência de foto de um item MUST ser independente da de qualquer outro item, inclusive dentro do mesmo desafio ou categoria.
- **FR-003**: Ao marcar no dia um item com "exige foto" ativa, o sistema MUST exigir o envio de uma foto como parte da conclusão dessa marcação, usando o mesmo mecanismo de compressão e armazenamento de foto já usado para fotos de evolução e de desafio surpresa.
- **FR-004**: Uma marcação de item com "exige foto" MUST permanecer pendente e MUST NOT ter seus pontos somados ao ranking da cliente até que a Patty aprove essa marcação.
- **FR-005**: Uma marcação de item sem "exige foto" MUST continuar somando seus pontos ao ranking imediatamente no momento da marcação, sem foto e sem aprovação — comportamento inalterado em relação ao atual.
- **FR-006**: O sistema MUST impedir uma nova marcação do mesmo item no mesmo dia enquanto já existir uma marcação (pendente ou já aprovada) daquele item para aquele dia — mesma regra hoje aplicada a qualquer marcação duplicada.
- **FR-007**: O sistema MUST exibir, em /painel/aprovacoes, uma fila única de pendências que reúne tanto comprovações de itens de desafio quanto participações de desafio surpresa aguardando decisão da Patty.
- **FR-008**: O sistema MUST permitir que a Patty visualize a foto enviada em cada comprovação pendente antes de decidir aprovar ou rejeitar.
- **FR-009**: Ao aprovar uma comprovação de item pendente, o sistema MUST liberar os pontos daquele item no ranking da cliente e MUST apagar a foto correspondente do armazenamento.
- **FR-010**: Ao rejeitar uma comprovação de item pendente, o sistema MUST apagar por completo o registro daquela marcação (sem conceder pontos) e MUST apagar a foto correspondente do armazenamento.
- **FR-011**: Após uma comprovação de item ser rejeitada, o sistema MUST permitir que a cliente marque esse mesmo item novamente no mesmo dia, enviando uma nova foto.
- **FR-012**: O sistema MUST indicar para a cliente, em cada item do dia que exige foto, se a marcação está pendente de aprovação ou já foi aprovada, para diferenciar de um item ainda não marcado.

### Key Entities *(include if feature involves data)*

- **Item de Desafio (Critério)**: já existente; passa a admitir uma exigência opcional de foto, configurada individualmente por item, além de descrição, pontos e frequência já existentes.
- **Marcação de Item**: já existente; quando o item exigir foto, a marcação passa a carregar a foto enviada e um status de aprovação (pendente, aprovado) que controla se seus pontos entram no ranking; quando rejeitada, deixa de existir.
- **Fila de Aprovações**: visão unificada, em /painel/aprovacoes, das comprovações de item e das participações de desafio surpresa que aguardam decisão da Patty.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A Patty consegue configurar "exige foto" item por item ao cadastrar/editar um desafio, sem que isso afete a exigência de nenhum outro item já cadastrado.
- **SC-002**: 100% das marcações de itens sem "exige foto" continuam pontuando imediatamente no ranking, sem nenhuma regressão em relação ao comportamento atual.
- **SC-003**: 100% das marcações de itens com "exige foto" ficam fora do ranking enquanto pendentes, e passam a contar assim que aprovadas — sem nenhum ponto indevido somado antes da decisão da Patty.
- **SC-004**: A Patty consegue revisar e decidir qualquer comprovação pendente — de item de desafio ou de desafio surpresa — em um único lugar (/painel/aprovacoes), sem precisar visitar telas diferentes para cada tipo.
- **SC-005**: Nenhuma foto de comprovação já decidida (aprovada ou rejeitada) permanece armazenada depois da decisão da Patty.
- **SC-006**: Depois de uma rejeição, a cliente consegue marcar novamente o mesmo item no mesmo dia sem nenhum bloqueio residual.

## Assumptions

- O envio de foto reaproveita o mesmo pipeline de compressão e o mesmo armazenamento de objetos (Cloudflare R2, via wrapper já existente no projeto) usado hoje em fotos de evolução e de desafio surpresa, em vez de criar um caminho paralelo.
- /painel/aprovacoes passa a ser a fila única também para participações de desafio surpresa pendentes, absorvendo a decisão que hoje é feita dentro da própria tela do desafio; não há mais um segundo lugar separado para aprovar/rejeitar desafio surpresa.
- Rejeitar uma comprovação apaga tanto o registro da marcação quanto a foto correspondente no armazenamento — mesmo objetivo de "não acumular storage" citado explicitamente para o caminho de aprovação.
- Alterar "exige foto" em um item já existente vale apenas para marcações feitas a partir dali; marcações já registradas antes da mudança não são recalculadas retroativamente.
- Uma marcação pendente aceita uma única foto por envio; para corrigir ou trocar a foto, a cliente depende de uma rejeição da Patty e de uma nova marcação, não de uma edição direta da comprovação pendente.
- A decisão de aprovar/rejeitar continua restrita a quem já tem acesso administrativo ao painel (mesmo controle de acesso hoje usado para aprovar contas e desafio surpresa), sem introduzir um novo nível de permissão.
