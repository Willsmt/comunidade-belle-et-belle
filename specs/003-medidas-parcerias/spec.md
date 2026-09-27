# Feature Specification: Protocolo Completo de Medidas com Leitura por Parceria

**Feature Branch**: `003-medidas-parcerias`

**Created**: 2026-09-27

**Status**: Draft

**Input**: User description: "Expandir a tabela de medidas da cliente e expor leitura para parcerias vinculadas. Parte 1 — Expansão do RegistroMedida: adicionar ao model já existente (contexto Perfil, rota /cliente/medidas) o protocolo completo de circunferências. Medidas de tronco (um valor cada, sem lado): ombro, peito/busto, cintura, abdômen, quadril. Medidas de membro (bilateral, direito e esquerdo separados, pra capturar assimetria relevante ao uso profissional): braço, antebraço, punho, coxa, joelho, panturrilha, tornozelo. Além de peso/altura já existentes. A cliente continua preenchendo suas próprias medidas em /cliente/medidas, sem mudança de fluxo, só formulário mais completo. Histórico por data mantido como já funciona hoje. Parte 2 — Visualização por parceria: parcerias (nutrição/personal) precisam ver o histórico de medidas das clientes vinculadas a elas, somente leitura (a parceria não registra suas próprias medições, só visualiza o que a cliente preencheu). Reaproveitar exatamente o padrão já usado em src/app/parceria/planos/ — gate requererPapel(['PARCERIA']) na action/query, checagem de VinculoParceria (clienteId + parceriaId da sessão, ativo: true) antes de retornar qualquer RegistroMedida daquela cliente, e a mesma listagem de clientes vinculadas já existente em planos/queries.ts como ponto de entrada. Nova rota /parceria/medidas (ou seção dentro de uma tela de detalhe da cliente, se fizer mais sentido estruturalmente — decisão de UI a avaliar no plan)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cliente registra o protocolo completo de medidas (Priority: P1)

A cliente, em /cliente/medidas, preenche um registro de medidas com o protocolo completo: peso, altura, medidas de tronco (ombro, peito/busto, cintura, abdômen, quadril) e medidas de membro capturadas separadamente para o lado direito e o esquerdo (braço, antebraço, punho, coxa, joelho, panturrilha, tornozelo). O fluxo de preenchimento continua o mesmo de hoje — só o formulário fica mais completo.

**Why this priority**: Sem o protocolo expandido no modelo de dados e no formulário, não existe nenhuma medida nova para a parceria visualizar depois — é a base de toda a feature.

**Independent Test**: Pode ser testado sozinho — a cliente abre /cliente/medidas, preenche os campos novos (tronco e membros, incluindo lados diferentes de uma mesma medida de membro), salva, e confirma que o registro aparece no histórico com todos os valores preenchidos, incluindo a distinção entre lado direito e esquerdo.

**Acceptance Scenarios**:

1. **Given** a cliente está em /cliente/medidas, **When** ela preenche peso, altura e as cinco medidas de tronco e salva, **Then** o registro é criado com todos esses valores associados à data do registro.
2. **Given** a cliente está preenchendo uma medida de membro (ex.: braço), **When** ela informa um valor diferente para o lado direito e para o lado esquerdo, **Then** o sistema salva os dois valores separadamente, sem misturar ou sobrescrever um com o outro.
3. **Given** a cliente mediu apenas um lado de uma medida de membro naquele dia (ex.: só o joelho direito), **When** ela salva o registro sem preencher o lado esquerdo, **Then** o registro é salvo normalmente, com o lado não preenchido ficando em branco (não como zero).
4. **Given** nenhum campo de medida foi preenchido, **When** a cliente tenta salvar o registro, **Then** o sistema impede o salvamento e pede que ao menos uma medida seja informada — mesma regra já aplicada hoje.

---

### User Story 2 - Parceria vinculada consulta o histórico de medidas de uma cliente (Priority: P1)

Uma parceria (nutrição ou personal) com vínculo ativo com uma cliente acessa o histórico completo de medidas dessa cliente — todas as datas e todos os campos que a cliente já preencheu — em modo somente leitura, sem poder criar, editar ou excluir nenhum registro.

**Why this priority**: É a segunda entrega central da feature e o motivo de negócio por trás da Parte 1 — sem essa visualização, o protocolo expandido continua útil só para a própria cliente, e a parceria não ganha nenhuma capacidade nova.

**Independent Test**: Com uma cliente vinculada que já tem registros de medida (US1), a parceria acessa a listagem de clientes vinculadas, escolhe essa cliente, e confirma que vê o histórico completo dela — todas as datas, todos os campos preenchidos — sem nenhuma opção de editar ou excluir.

**Acceptance Scenarios**:

1. **Given** uma parceria com vínculo ativo com uma cliente que tem múltiplos registros de medida em datas diferentes, **When** a parceria abre o histórico dessa cliente, **Then** vê todos os registros, ordenados por data, com todos os campos (tronco, membros com lado direito/esquerdo, peso, altura) que a cliente preencheu em cada um.
2. **Given** a parceria está visualizando o histórico de uma cliente, **When** ela procura por qualquer forma de criar, editar ou excluir um registro de medida, **Then** não encontra nenhuma — a tela é somente leitura.
3. **Given** uma cliente vinculada ainda não registrou nenhuma medida, **When** a parceria abre o histórico dela, **Then** vê um estado vazio claro, sem erro.

---

### User Story 3 - Acesso da parceria é isolado por vínculo ativo (Priority: P2)

Uma parceria só consegue ver o histórico de medidas de clientes com quem tem um vínculo ativo no momento do acesso. Isso vale tanto para impedir o acesso a clientes nunca vinculadas quanto para revogar o acesso no momento em que um vínculo é desativado.

**Why this priority**: É a garantia de privacidade que sustenta a Parte 2 — sem ela, a leitura de medidas deixaria de ser um acesso controlado por vínculo e passaria a expor dados de saúde/corpo de qualquer cliente para qualquer parceria.

**Independent Test**: Pode ser testado isoladamente — com duas clientes, uma vinculada e outra não à mesma parceria, a parceria consegue ver o histórico só da vinculada; ao desativar o vínculo da primeira, uma nova tentativa de acesso a ela também passa a ser bloqueada.

**Acceptance Scenarios**:

1. **Given** uma parceria sem vínculo com uma cliente, **When** ela tenta acessar o histórico de medidas dessa cliente (inclusive tentando pela URL/id direto, se aplicável), **Then** o acesso é negado.
2. **Given** uma parceria com vínculo ativo com uma cliente, **When** esse vínculo é desativado, **Then** uma tentativa de acesso posterior ao histórico dessa cliente é negada, mesmo que a parceria tivesse acessado antes da desativação.
3. **Given** uma parceria vinculada a várias clientes, **When** ela acessa o histórico de uma delas, **Then** vê apenas os registros daquela cliente específica, nunca misturados com os de outra.

---

### Edge Cases

- O que acontece com registros de medida já existentes, feitos antes desta expansão? Continuam aparecendo no histórico normalmente, com os campos novos (tronco e membros bilaterais) em branco, já que nunca foram preenchidos.
- Como o histórico distingue "medida de um lado não preenchida" de "medida zero"? O lado não preenchido fica em branco/ausente, nunca é interpretado como zero.
- O que acontece se a parceria não tiver nenhuma cliente vinculada ainda? A listagem de clientes vinculadas (ponto de entrada) aparece vazia, sem erro, e não há como chegar a nenhum histórico de medidas a partir dela.
- O que acontece se o vínculo de uma parceria com uma cliente for reativado depois de ter sido desativado? O acesso ao histórico volta a funcionar normalmente, seguindo o estado atual do vínculo no momento do acesso.
- O que acontece se uma cliente tiver registros antigos com uma medida de membro em valor único (antes da separação por lado) e registros novos já com direito/esquerdo? Ambos aparecem no histórico por data; o registro antigo não é reclassificado retroativamente em nenhum dos dois lados.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir que a cliente registre, além de peso e altura, as medidas de tronco (ombro, peito/busto, cintura, abdômen, quadril) como um único valor cada, sem distinção de lado.
- **FR-002**: O sistema MUST permitir que a cliente registre as medidas de membro (braço, antebraço, punho, coxa, joelho, panturrilha, tornozelo) com valores separados para o lado direito e o lado esquerdo de cada medida.
- **FR-003**: Cada campo de medida (tronco, membro por lado, peso, altura) MUST continuar opcional individualmente — a cliente preenche só o que mediu naquele dia, como já funciona hoje.
- **FR-004**: O sistema MUST continuar exigindo que ao menos uma medida seja preenchida para salvar um registro, mesma regra já aplicada hoje ao formulário atual.
- **FR-005**: O sistema MUST manter o histórico de registros de medida organizado por data, exatamente como já funciona hoje, agora incluindo os novos campos quando preenchidos.
- **FR-006**: Registros de medida já existentes, feitos antes desta expansão, MUST continuar visíveis no histórico sem nenhuma perda de dado já preenchido.
- **FR-007**: Apenas a própria cliente MUST poder criar, editar ou excluir seus próprios registros de medida; nenhum outro papel, incluindo parceria, MUST NOT ter essa capacidade sobre registros de qualquer cliente.
- **FR-008**: O sistema MUST permitir que uma parceria (papel PARCERIA) visualize, em modo somente leitura, o histórico completo de medidas de uma cliente.
- **FR-009**: O sistema MUST só permitir essa visualização quando existir um vínculo ativo entre aquela parceria e aquela cliente especificamente, verificado no momento do acesso.
- **FR-010**: O sistema MUST negar o acesso ao histórico de medidas de uma cliente para qualquer parceria sem vínculo ativo com ela, mesmo que a parceria tenha vínculo ativo com outras clientes.
- **FR-011**: O sistema MUST refletir mudanças no vínculo (ativação/desativação) nas tentativas de acesso seguintes — um vínculo desativado bloqueia acessos novos, mesmo que tenha havido acesso permitido antes da desativação.
- **FR-012**: O sistema MUST oferecer, como ponto de entrada para a parceria escolher de qual cliente ver o histórico, a mesma listagem de clientes vinculadas (com vínculo ativo) já usada hoje na área de planos da parceria.
- **FR-013**: A visualização da parceria MUST NOT expor nenhuma forma de criar, editar ou excluir um registro de medida — é somente leitura.

### Key Entities *(include if feature involves data)*

- **Registro de Medida**: já existente, associado à cliente e a uma data; passa a incluir, além de peso e altura, cinco medidas de tronco (valor único cada) e sete medidas de membro capturadas separadamente para o lado direito e o lado esquerdo, permitindo registrar assimetria entre os lados do corpo.
- **Vínculo de Parceria**: já existente; relação ativa entre uma parceria e uma cliente que autoriza a parceria a ler o histórico de medidas daquela cliente especificamente; nenhuma mudança no seu formato ou nas regras de quem cria/desativa o vínculo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A cliente consegue registrar peso, altura, as cinco medidas de tronco e as sete medidas de membro (com lado direito e esquerdo) em um único envio de formulário, sem precisar de múltiplos passos.
- **SC-002**: 100% dos registros de medida feitos antes desta expansão continuam aparecendo no histórico da cliente, sem nenhuma perda de dado.
- **SC-003**: Uma parceria com vínculo ativo consegue chegar ao histórico completo de medidas de qualquer cliente vinculada a ela a partir de um único ponto de entrada (a listagem de clientes vinculadas), sem depender de a cliente enviar essa informação por fora do sistema.
- **SC-004**: 100% das tentativas de acesso de uma parceria ao histórico de medidas de uma cliente sem vínculo ativo são bloqueadas.
- **SC-005**: Nenhuma parceria consegue criar, editar ou excluir um registro de medida de nenhuma cliente através da nova visualização.

## Assumptions

- "Altura" é tratada aqui como um campo novo do Registro de Medida: hoje só peso, cintura, quadril, braço e coxa existem no formulário; o pedido de manter "peso/altura já existentes" foi interpretado como adicionar altura junto com os demais campos novos, e não como algo que já precisa ser migrado.
- As medidas de braço e coxa, hoje registradas como um valor único (sem lado), passam a ser capturadas com lado direito e esquerdo separados a partir desta expansão. Registros antigos com valor único não são reclassificados retroativamente como "direito" ou "esquerdo" — continuam representando uma medida sem lado especificado, e a forma exata de exibi-los ao lado dos novos campos bilaterais fica para o plano de implementação.
- Parcerias de nutrição e de personal recebem o mesmo nível de acesso de leitura ao histórico de medidas, sem distinção por especialidade — mesmo padrão já usado hoje na área de planos, onde qualquer parceria vinculada pode enviar tanto plano de treino quanto de dieta.
- A estrutura exata da tela da parceria (rota dedicada /parceria/medidas ou seção dentro de uma tela de detalhe da cliente) é uma decisão de UI a ser resolvida no plano de implementação, não nesta especificação.
- O acesso de leitura da parceria reaproveita o mesmo mecanismo de vínculo (VinculoParceria com ativo: true) já usado para liberar o envio de planos, sem introduzir um novo tipo de permissão ou um vínculo específico para medidas.
