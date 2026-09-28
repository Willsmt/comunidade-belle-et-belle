# Feature Specification: Post em Destaque no Feed

**Feature Branch**: `004-post-destaque-feed`

**Created**: 2026-09-27

**Status**: Draft

**Input**: User description: "Post em destaque no Feed. Schema: Post ganha campo destaque: Boolean @default(false). Comportamento: só um post pode estar em destaque por vez — marcar um novo automaticamente desmarca o anterior (mesmo padrão \"um ativo por vez\" já usado em Desafio.ativo e CicloPacote.ativo: transação que desativa o atual antes de ativar o novo). Restrito a quem já tem requererAcessoPainel() — mesmo gate já usado em painel/pacotes, painel/desafios, painel/aprovacoes; não introduzir nível de permissão novo. Duas formas de marcar, ambas reaproveitando padrão existente: 1. Checkbox \"Marcar como destaque\" na criação de post (/feed/novo) — mesmo padrão do checkbox \"Exige foto\" já usado na criação de item de desafio. 2. Botão de alternância em qualquer post já publicado (mesmo padrão de BotaoAlternarExigeFoto/BotaoReabrirDesafio) — só visível/clicável para quem tem requererAcessoPainel(). Exibição: no Feed, o post em destaque aparece fixado no topo, acima da lista cronológica normal, com indicador visual (badge \"Destaque\") o distinguindo dos demais. Teste: cobrir a mutualidade (marcar um novo destaque desmarca o anterior — só um ativo por vez), o gate de acesso (rejeita sem requererAcessoPainel()), e a exibição fixada no topo."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Quem tem acesso ao painel marca um post como destaque na criação (Priority: P1)

Quem já tem `requererAcessoPainel()` cria um post em `/feed/novo` e marca a caixa "Marcar como destaque". Ao publicar, esse post passa a ser o destaque do Feed, e qualquer post que estivesse em destaque antes deixa de estar.

**Why this priority**: É o caminho de entrada mais simples da feature — sem ele, nenhum post nasce em destaque e não há nada para exibir fixado no Feed.

**Independent Test**: Pode ser testado sozinho — publicar um post em `/feed/novo` com a caixa marcada e confirmar que ele é o único post com `destaque: true` no banco.

**Acceptance Scenarios**:

1. **Given** quem tem acesso ao painel está em `/feed/novo`, **When** marca "Marcar como destaque" e publica o post, **Then** o post criado fica com `destaque: true`.
2. **Given** já existe um post em destaque, **When** um novo post é publicado com a caixa marcada, **Then** o post anterior deixa de estar em destaque e o novo passa a ser o único.
3. **Given** quem tem acesso ao painel está em `/feed/novo`, **When** publica um post sem marcar a caixa, **Then** o post é criado normalmente com `destaque: false`, sem afetar o destaque atual.

---

### User Story 2 - Quem tem acesso ao painel alterna o destaque de um post já publicado (Priority: P1)

Quem já tem `requererAcessoPainel()` vê, em qualquer post já publicado no Feed, um botão de alternância de destaque. Ao acioná-lo em um post que não está em destaque, esse post passa a ser o destaque (desmarcando o anterior, se houver); ao acioná-lo no post que já está em destaque, o destaque é removido e nenhum post fica em destaque.

**Why this priority**: Sem essa via, o destaque só poderia ser definido no momento da criação — a maior parte do valor do recurso (promover um post já existente) dependeria de recriar o post.

**Independent Test**: Pode ser testado sozinho — com um post já publicado sem destaque, acionar o botão de alternância nele e confirmar que passa a ser o único post com `destaque: true`; acioná-lo de novo e confirmar que nenhum post fica em destaque.

**Acceptance Scenarios**:

1. **Given** um post publicado sem destaque, **When** quem tem acesso ao painel aciona o botão de alternância nesse post, **Then** o post passa a ter `destaque: true`.
2. **Given** um post A em destaque e um post B sem destaque, **When** o botão de alternância é acionado no post B, **Then** o post B passa a `destaque: true` e o post A passa a `destaque: false`.
3. **Given** um post já em destaque, **When** o botão de alternância é acionado nesse mesmo post, **Then** o destaque é removido e nenhum post fica em destaque.

---

### User Story 3 - Post em destaque aparece fixado no topo do Feed (Priority: P1)

Qualquer pessoa que acessa o Feed vê o post em destaque fixado no topo, acima da lista cronológica normal, com um indicador visual ("Destaque") que o distingue dos demais posts.

**Why this priority**: É a razão de existir da feature do ponto de vista de quem lê o Feed — sem essa exibição, marcar um post como destaque não teria efeito visível.

**Independent Test**: Pode ser testado sozinho — com um post em destaque publicado antes de outros posts mais recentes, abrir o Feed e confirmar que o post em destaque aparece no topo com o indicador visual, independentemente da data de publicação dos demais.

**Acceptance Scenarios**:

1. **Given** existe um post em destaque e outros posts mais recentes na ordem cronológica, **When** o Feed é carregado, **Then** o post em destaque aparece no topo, acima de todos os outros, com o indicador visual "Destaque".
2. **Given** nenhum post está em destaque, **When** o Feed é carregado, **Then** a lista aparece apenas na ordem cronológica normal, sem seção fixada no topo.
3. **Given** um post em destaque, **When** o destaque é removido dele (via alternância), **Then** ele volta a aparecer apenas na posição cronológica normal da lista, sem o indicador visual.

---

### User Story 4 - Quem não tem acesso ao painel não consegue marcar destaque (Priority: P2)

Uma pessoa sem `requererAcessoPainel()` não vê (ou, se tentar diretamente, tem rejeitada) qualquer forma de marcar ou desmarcar o destaque de um post — nem a caixa na criação, nem o botão de alternância em posts publicados.

**Why this priority**: É a garantia de que o controle do destaque continua restrito a quem administra o painel, como já ocorre nos demais recursos que reaproveitam o mesmo gate; sem essa garantia, o recurso ficaria aberto a qualquer autor de post.

**Independent Test**: Pode ser testado isoladamente — autenticado como alguém sem acesso ao painel, tentar acionar a marcação de destaque (na criação ou na alternância) diretamente e confirmar que a ação é rejeitada.

**Acceptance Scenarios**:

1. **Given** uma pessoa sem `requererAcessoPainel()`, **When** ela acessa `/feed/novo`, **Then** não vê a caixa "Marcar como destaque".
2. **Given** uma pessoa sem `requererAcessoPainel()`, **When** ela visualiza um post publicado no Feed, **Then** não vê o botão de alternância de destaque nesse post.
3. **Given** uma pessoa sem `requererAcessoPainel()`, **When** ela aciona diretamente a ação de marcar/alternar destaque (contornando a interface), **Then** o sistema rejeita a ação e o estado de destaque não muda.

---

### Edge Cases

- O que acontece se duas marcações de destaque (por exemplo, publicar um novo post em destaque e alternar outro post existente) forem acionadas quase ao mesmo tempo? Apenas um post MUST ficar em destaque ao final — a garantia de mutualidade não pode permitir dois posts em destaque simultaneamente mesmo sob concorrência.
- O que acontece se o post atualmente em destaque for excluído? Nenhum post permanece em destaque automaticamente após a exclusão; o Feed passa a exibir apenas a lista cronológica até que outro post seja marcado.
- O que acontece se não existir nenhum post em destaque? O Feed exibe apenas a lista cronológica normal, sem seção fixada no topo nem indicador visual.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir que um post seja marcado como "em destaque", através de um campo booleano próprio do post, com valor padrão de não estar em destaque.
- **FR-002**: O sistema MUST garantir que no máximo um post esteja em destaque ao mesmo tempo — marcar um post como destaque MUST desmarcar automaticamente qualquer outro post que estivesse em destaque, como uma única operação atômica.
- **FR-003**: O sistema MUST permitir marcar um post como destaque no momento da criação, através de uma opção explícita no formulário de novo post (`/feed/novo`).
- **FR-004**: O sistema MUST permitir alternar o destaque de qualquer post já publicado (marcar se não estiver em destaque, remover se já estiver), sem exigir a exclusão ou recriação do post.
- **FR-005**: Apenas quem satisfaz o mesmo gate de acesso já usado nas áreas do painel (pacotes, desafios, aprovações) MUST poder marcar ou alternar o destaque de um post, seja na criação, seja em post já publicado; nenhum novo nível de permissão MUST ser introduzido para isso.
- **FR-006**: O sistema MUST rejeitar qualquer tentativa de marcar ou alternar o destaque feita por quem não satisfaz esse gate de acesso, mesmo que a tentativa contorne a interface.
- **FR-007**: O Feed MUST exibir o post em destaque (quando existir um) fixado no topo, acima da lista cronológica normal, independentemente da data de publicação desse post em relação aos demais.
- **FR-008**: O post em destaque exibido no Feed MUST trazer um indicador visual ("Destaque") que o distingue visualmente dos demais posts da lista.
- **FR-009**: Quando nenhum post estiver em destaque, o Feed MUST exibir apenas a lista cronológica normal, sem seção fixada no topo nem indicador visual.
- **FR-010**: A lista cronológica normal do Feed MUST NOT exibir o post em destaque duplicado — ele aparece apenas na posição fixada no topo enquanto estiver em destaque.

### Key Entities *(include if feature involves data)*

- **Post**: entidade já existente do Feed; passa a incluir um atributo booleano indicando se está em destaque, com valor padrão de não estar em destaque. Segue o mesmo padrão de mutualidade "um ativo por vez" já aplicado a outras entidades do sistema (por exemplo, o desafio ativo e o ciclo de pacote ativo de uma cliente).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em qualquer momento, no máximo um post está marcado como destaque no sistema — verificável consultando os posts existentes.
- **SC-002**: Quem tem acesso ao painel consegue promover qualquer post já publicado a destaque em uma única ação, sem precisar excluir ou recriar o post.
- **SC-003**: Ao abrir o Feed, qualquer pessoa identifica o post em destaque (quando existir) em menos de um relance, por ele aparecer no topo com um indicador visual próprio, sem precisar procurar na lista cronológica.
- **SC-004**: 100% das tentativas de marcar ou alternar destaque feitas por quem não tem acesso ao painel são rejeitadas, incluindo tentativas que contornam a interface.

## Assumptions

- "Post" refere-se à entidade já existente do Feed (autor, texto, imagem, likes, comentários); a feature não introduz um novo tipo de conteúdo, apenas um atributo sobre o post existente.
- O gate de acesso a ser reaproveitado é exatamente o já usado em `painel/pacotes`, `painel/desafios` e `painel/aprovacoes` (aqui chamado de forma técnica de `requererAcessoPainel()` na descrição do pedido) — não há distinção adicional de papel dentro de quem já tem esse acesso.
- Excluir o post que está em destaque remove o destaque junto com o post, sem transferir automaticamente o destaque para nenhum outro post; um novo destaque só é definido por uma ação explícita subsequente.
- O indicador visual "Destaque" é um selo/badge textual associado ao post fixado, sem exigir estilo visual específico além de distingui-lo dos demais — o desenho exato fica para o plano de implementação, desde que reaproveite os padrões visuais já usados no Feed.
- A alternância de destaque em post publicado é uma ação síncrona de like/dislike simples (liga/desliga), sem necessidade de confirmação adicional — mesmo padrão de fricção já usado em `BotaoAlternarExigeFoto`/`BotaoReabrirDesafio`.
