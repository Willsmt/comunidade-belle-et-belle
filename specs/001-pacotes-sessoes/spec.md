# Feature Specification: Pacotes de Sessões

**Feature Branch**: `001-pacotes-sessoes`

**Created**: 2026-09-26

**Status**: Draft

**Input**: User description: "Sistema de pacotes de sessões para clientes da comunidade. A Patty vende pacotes com sessões distribuídas por tipo (ex: "Projeto Corpo dos Sonhos" = 4 aplicação + 4 radiofrequência + 4 ultrassom). Precisa: (1) cadastro de tipos de pacote pelo painel — nome do pacote + lista de tipos de sessão com quantidade cada; (2) vincular um pacote a uma cliente (ciclo ativo); (3) no painel de Membros, mostrar contador por tipo de sessão do ciclo ativo (X/Y) e botão pra Patty marcar uma sessão realizada, incrementando o contador daquele tipo; (4) renovar pacote — abre novo ciclo pra cliente, mesmo padrão de edições sequenciais já usado no contexto Desafios (ciclo anterior arquivado como histórico, não deletado nem resetado); (5) histórico de sessões realizadas (data de cada marcação) visível no painel, não só o contador atual do ciclo."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cadastrar tipos de pacote (Priority: P1)

A Patty acessa o painel e cadastra um tipo de pacote (ex.: "Projeto Corpo dos Sonhos"), definindo a lista de tipos de sessão que o compõem e a quantidade contratada de cada tipo (ex.: 4 aplicação + 4 radiofrequência + 4 ultrassom).

**Why this priority**: Sem um catálogo de pacotes cadastrado, nenhuma das outras funcionalidades (vincular, marcar sessão, renovar, histórico) tem o que operar sobre. É a base de tudo.

**Independent Test**: Pode ser testado sozinho — a Patty cria um tipo de pacote, informa nome e composição (tipo de sessão + quantidade), salva, e consegue ver esse pacote listado no painel com sua composição correta, mesmo sem nenhuma cliente vinculada ainda.

**Acceptance Scenarios**:

1. **Given** a Patty está no painel de cadastro de pacotes, **When** ela informa um nome e adiciona 3 tipos de sessão com suas quantidades e salva, **Then** o pacote aparece na lista de tipos de pacote com nome e composição corretos.
2. **Given** um tipo de pacote já cadastrado, **When** a Patty tenta salvar um novo pacote sem nenhum tipo de sessão associado, **Then** o sistema impede o salvamento e indica que ao menos um tipo de sessão com quantidade é obrigatório.
3. **Given** um tipo de sessão ou tipo de pacote já cadastrado, **When** a Patty edita o nome (ou, no caso de tipo de pacote, também a composição), **Then** a mudança é salva e ciclos já criados a partir dele continuam com sua própria composição, intactos.
4. **Given** um tipo de sessão ou tipo de pacote que nunca foi usado em nenhum ciclo, **When** a Patty exclui, **Then** o registro é removido de verdade e não aparece mais em lugar nenhum.
5. **Given** um tipo de sessão ou tipo de pacote que já foi usado em algum ciclo (ativo ou arquivado) de alguma cliente, **When** a Patty exclui, **Then** ele é arquivado (não aparece mais como opção para novos pacotes/vínculos) em vez de apagado, e o histórico de quem já usou continua intacto.
6. **Given** um tipo de sessão ou tipo de pacote arquivado, **When** a Patty reativa, **Then** ele volta a aparecer como opção para novos pacotes/vínculos.

---

### User Story 2 - Vincular pacote, acompanhar e marcar sessões realizadas (Priority: P1)

A Patty vincula um tipo de pacote a uma cliente, criando o ciclo ativo dela. No painel de Membros, ela vê o contador por tipo de sessão do ciclo ativo (X/Y) e usa um botão para marcar uma sessão como realizada, incrementando o contador daquele tipo.

**Why this priority**: É o uso diário do sistema — sem isso, cadastrar pacotes não gera valor nenhum. Junto com a US1, forma o MVP.

**Independent Test**: Com um tipo de pacote já cadastrado (US1), a Patty vincula esse pacote a uma cliente, vê os contadores zerados por tipo (0/Y), marca uma sessão de um tipo específico e confirma que o contador daquele tipo passou para 1/Y, sem afetar os outros tipos.

**Acceptance Scenarios**:

1. **Given** uma cliente sem pacote vinculado, **When** a Patty vincula um tipo de pacote a ela, **Then** um ciclo ativo é criado para a cliente com contadores zerados (0/Y) para cada tipo de sessão do pacote.
2. **Given** uma cliente com ciclo ativo e um tipo de sessão em 2/4, **When** a Patty marca uma sessão realizada daquele tipo, **Then** o contador passa para 3/4 e os contadores dos outros tipos permanecem inalterados.
3. **Given** um tipo de sessão já em 4/4 (quantidade contratada atingida), **When** a Patty tenta marcar outra sessão daquele mesmo tipo, **Then** o sistema bloqueia a ação e indica que a quantidade contratada para aquele tipo já foi cumprida.
4. **Given** uma sessão marcada por engano, **When** a Patty desfaz essa marcação específica, **Then** o contador daquele tipo é decrementado de volta e a marcação some do histórico de sessões realizadas.
5. **Given** uma cliente sem nenhum pacote vinculado, **When** a Patty abre o card dela no painel de Membros, **Then** o sistema indica claramente que não há ciclo ativo, sem exibir contadores.

---

### User Story 3 - Renovar pacote (Priority: P2)

A Patty renova o pacote de uma cliente, abrindo um novo ciclo ativo para ela (mesmo tipo de pacote ou outro). O ciclo anterior é arquivado como histórico — não é deletado nem resetado — seguindo o mesmo padrão de edições sequenciais já usado para Desafios.

**Why this priority**: É necessário para o negócio continuar (cliente compra um novo pacote quando termina o anterior), mas só faz sentido depois que o ciclo básico de acompanhamento (US2) já existe e já foi usado.

**Independent Test**: Com uma cliente que já tem um ciclo ativo (mesmo que incompleto), a Patty aciona "renovar pacote", escolhe o tipo de pacote do novo ciclo, e confirma que passa a existir um novo ciclo ativo com contadores zerados, enquanto o ciclo anterior deixa de ser o ativo mas continua acessível como histórico.

**Acceptance Scenarios**:

1. **Given** uma cliente com um ciclo ativo (independente de estar completo ou não), **When** a Patty aciona "renovar pacote", escolhe um tipo de pacote e confirma a substituição — vendo antes o estado atual do ciclo (contador por tipo) que será arquivado —, **Then** um novo ciclo ativo é criado com contadores zerados e o ciclo anterior passa a ser histórico (não ativo), permanecendo consultável.
2. **Given** a confirmação de substituição do ciclo ativo exibida (com o contador por tipo do ciclo atual), **When** a Patty cancela em vez de confirmar, **Then** nenhuma alteração é feita — o ciclo ativo original permanece intacto, sem novo ciclo criado.
3. **Given** um ciclo antigo que foi arquivado por uma renovação, **When** qualquer pessoa consulta esse ciclo depois, **Then** os dados originais dele (composição do pacote e sessões marcadas) continuam intactos, sem terem sido deletados ou zerados.

---

### User Story 4 - Histórico de sessões realizadas (Priority: P3)

No painel, além do contador atual do ciclo ativo, é possível ver o histórico de sessões realizadas com a data de cada marcação.

**Why this priority**: Agrega contexto e rastreabilidade sobre o contador simples, mas o negócio já opera sem isso (o contador X/Y das US1-US3 já cobre o essencial do dia a dia).

**Independent Test**: Com algumas sessões já marcadas para uma cliente (de um ou mais ciclos), a Patty abre o histórico dela no painel e vê cada sessão realizada listada com tipo e data, incluindo sessões de ciclos já arquivados.

**Acceptance Scenarios**:

1. **Given** uma cliente com 3 sessões marcadas em datas diferentes no ciclo ativo, **When** a Patty abre o histórico dela, **Then** vê as 3 marcações listadas, cada uma com tipo de sessão e data.
2. **Given** uma cliente que já teve um ciclo renovado (US3), **When** a Patty abre o histórico dela, **Then** vê também as sessões marcadas no(s) ciclo(s) anterior(es) arquivado(s), diferenciadas do ciclo ativo atual.

### Edge Cases

- Tentativa de vincular um pacote a uma cliente que já tem ciclo ativo: substitui/arquiva o ciclo atual (mesma ação de renovar, ver US3), não cria um segundo ciclo ativo em paralelo.
- Tipo de pacote fica com quantidade zero para um tipo de sessão: sistema impede quantidade zero ou negativa por tipo (cada tipo listado precisa ter quantidade ≥ 1).
- Exclusão/edição de um tipo de pacote já vinculado a clientes ativas: a composição do pacote nos ciclos já criados não é afetada retroativamente por uma edição posterior do tipo de pacote (o ciclo guarda sua própria composição no momento em que foi vinculado).
- Desfazer a marcação mais antiga de um ciclo (não a última): permitido remover qualquer marcação específica do histórico, não só a mais recente.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir que a Patty (usuária com acesso ao painel) cadastre um tipo de pacote com nome e uma lista de tipos de sessão, cada um com uma quantidade contratada (inteiro ≥ 1).
- **FR-002**: O sistema MUST exigir ao menos um tipo de sessão com quantidade para salvar um tipo de pacote.
- **FR-003**: O sistema MUST permitir vincular um tipo de pacote a uma cliente, criando um ciclo ativo com contador zerado para cada tipo de sessão do pacote.
- **FR-004**: O sistema MUST permitir no máximo um ciclo ativo por cliente por vez; vincular um novo pacote a uma cliente que já tem ciclo ativo MUST arquivar o ciclo atual (mesmo comportamento de renovar, FR-006) em vez de criar um segundo ciclo ativo em paralelo.
- **FR-005**: No painel de Membros, o sistema MUST exibir, para a cliente com ciclo ativo, o contador por tipo de sessão no formato realizado/contratado (X/Y), e um controle para marcar uma sessão realizada por tipo.
- **FR-006**: Ao marcar uma sessão realizada de um tipo, o sistema MUST incrementar em 1 o contador daquele tipo específico e registrar a data da marcação, sem alterar os contadores dos demais tipos do mesmo ciclo.
- **FR-007**: O sistema MUST impedir marcar uma sessão de um tipo cujo contador já atingiu a quantidade contratada (X = Y), informando que o limite do pacote para aquele tipo já foi cumprido.
- **FR-008**: O sistema MUST permitir desfazer/remover uma marcação de sessão específica (não só a última), decrementando o contador do tipo correspondente e removendo-a do histórico.
- **FR-009**: O sistema MUST permitir renovar o pacote de uma cliente, abrindo um novo ciclo ativo (com o mesmo tipo de pacote ou outro, à escolha da Patty) e arquivando o ciclo anterior como histórico.
- **FR-010**: O sistema MUST NOT deletar nem resetar os dados de um ciclo arquivado (composição do pacote no momento do vínculo e sessões marcadas) ao criar um novo ciclo — o histórico permanece íntegro e consultável.
- **FR-011**: O sistema MUST exibir, além do contador do ciclo ativo, um histórico de sessões realizadas com a data de cada marcação, incluindo sessões de ciclos já arquivados, indicando a qual ciclo cada sessão pertence.
- **FR-012**: O sistema MUST restringir cadastro de tipos de pacote, vínculo de pacote a cliente, marcação/desfazer de sessão e renovação a usuários com acesso ao painel administrativo (mesmo controle de acesso já usado para as demais ações do painel).
- **FR-013**: Uma edição posterior em um tipo de pacote (nome ou composição) MUST NOT alterar retroativamente a composição de ciclos já criados a partir daquele tipo de pacote.
- **FR-014**: Sempre que vincular ou renovar um pacote for substituir/arquivar um ciclo já ativo de uma cliente (FR-004, FR-009), o sistema MUST exigir confirmação explícita da Patty antes de efetivar a substituição, exibindo o estado atual do ciclo (contador por tipo) que será arquivado; cancelar a confirmação MUST NOT alterar nada.
- **FR-015**: O sistema MUST permitir editar o nome de um tipo de sessão, e o nome e a composição de um tipo de pacote, sem que isso altere retroativamente ciclos já criados (reforça FR-013).
- **FR-016**: Excluir um tipo de sessão ou tipo de pacote que já esteja em uso em algum ciclo (ativo ou arquivado) de qualquer cliente MUST arquivá-lo (ocultando-o das opções de seleção para novos tipos de pacote/vínculos) em vez de apagá-lo, preservando o histórico de quem já o usou.
- **FR-017**: Excluir um tipo de sessão ou tipo de pacote que nunca foi usado em nenhum ciclo MUST removê-lo definitivamente.
- **FR-018**: O sistema MUST permitir reativar um tipo de sessão ou tipo de pacote arquivado, fazendo-o voltar a aparecer como opção de seleção.

### Key Entities

- **Tipo de Pacote**: catálogo cadastrado pela Patty. Tem nome, uma composição — lista de (tipo de sessão, quantidade contratada) — e um estado ativo/arquivado (FR-016 a FR-018). É reutilizável entre várias clientes e ciclos.
- **Tipo de Sessão**: categoria de sessão cadastrada pela Patty (ex.: aplicação, radiofrequência, ultrassom), reutilizável entre vários tipos de pacote, com um estado ativo/arquivado (FR-016 a FR-018).
- **Ciclo de Pacote**: vínculo entre uma cliente e um tipo de pacote, com sua própria cópia da composição (quantidade contratada por tipo) no momento em que foi criado, um estado (ativo ou arquivado/histórico) e a data em que foi iniciado. Cada cliente tem no máximo um ciclo ativo por vez; ciclos arquivados permanecem associados à cliente como histórico.
- **Sessão Realizada**: registro de uma sessão marcada como concluída, associada a um ciclo, a um tipo de sessão dentro daquele ciclo, e à data em que foi realizada/marcada.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A Patty consegue cadastrar um novo tipo de pacote completo (nome + todos os tipos de sessão e quantidades) em menos de 2 minutos.
- **SC-002**: Depois de vincular um pacote a uma cliente, o contador por tipo de sessão reflete corretamente cada marcação/desfazer em tempo real, sem exigir atualização manual da página para os dados já enviados.
- **SC-003**: 100% das tentativas de marcar uma sessão de um tipo já no limite contratado são bloqueadas, sem exceção.
- **SC-004**: Depois de uma renovação, 100% dos dados do ciclo anterior (composição e sessões marcadas) continuam acessíveis e sem alteração no histórico.
- **SC-005**: A Patty consegue, a partir do painel de Membros, ver a data de qualquer sessão específica já realizada por uma cliente (ciclo atual ou anteriores) sem precisar de suporte técnico ou acesso ao banco de dados.

## Assumptions

- "A Patty" se refere a qualquer usuário com papel/permissão de acesso ao painel administrativo, seguindo o mesmo gate de acesso já usado nas demais telas do painel — a funcionalidade não é restrita a uma conta específica.
- Renovar um pacote é sempre uma ação manual, disparada pela Patty a qualquer momento (não é automática mesmo quando todos os tipos do ciclo atingem X = Y).
- Ao renovar, a Patty escolhe explicitamente o tipo de pacote do novo ciclo (pode repetir o mesmo tipo de pacote anterior ou escolher um diferente).
- O contador exibido no painel de Membros é sempre relativo ao ciclo ativo da cliente; ciclos arquivados são consultados separadamente, na seção de histórico.
- Não há, neste momento, uma área voltada à própria cliente para visualizar seu progresso de pacote — a visibilidade descrita (contador e histórico) é apenas no painel administrativo (Membros), como especificado no pedido original.
- Excluir (FR-016/FR-017) considera "em uso" qualquer referência existente a esse tipo de sessão/pacote em `ItemTipoPacote`, `ItemCicloPacote` ou `SessaoRealizada` (para tipo de sessão) ou em `CicloPacote` (para tipo de pacote) — ou seja, mesmo um tipo de pacote nunca vinculado a nenhuma cliente, mas que ainda compõe outro cadastro, não é considerado "em uso" para fins desta regra; só vínculo real a um ciclo de cliente conta.
