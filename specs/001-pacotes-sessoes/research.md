# Research: Pacotes de Sessões

Nenhum item do Technical Context ficou como `NEEDS CLARIFICATION` — o projeto já
tem stack e convenções fixadas (ver `.specify/memory/constitution.md`). As
decisões abaixo são pontos de design que não estavam explícitos no pedido
original e foram resolvidos aqui, olhando o padrão já usado no código (Princípio
II da constituição: reaproveitar em vez de recriar), para ficarem visíveis antes
do desenho de dados/tarefas.

## Decisão 1 (revisada): "Tipo de sessão" é um catálogo cadastrável, não um enum

> **Atualizado após revisão do usuário.** A versão original desta decisão
> propunha `TipoSessao` como enum fixo do Prisma. O usuário decidiu, antes da
> geração de `tasks.md`, que precisa cadastrar novos tipos de sessão pelo
> painel sem depender de deploy — a decisão abaixo substitui a anterior.

**Decision**: `TipoSessao` é um model próprio (catálogo), igual em espírito a
`TipoPacote`: `id`, `nome`, `criadoEm`. `ItemTipoPacote` e `ItemCicloPacote`
referenciam `TipoSessao` por FK (`tipoSessaoId`) em vez de um enum.
Consequência direta: `SessaoRealizada.tipoSessao` (que também dependia do enum)
passa a ser `tipoSessaoId` (FK) também — não há mais nenhum uso do enum no
schema. Cadastro de `TipoSessao` (nome) vive na mesma tela `painel/pacotes/`,
como uma seção própria acima do formulário de tipo de pacote (o seletor de
tipos de sessão do formulário de tipo de pacote passa a listar os `TipoSessao`
já cadastrados). Escopo do cadastro: criar + listar, sem edição/exclusão — mesmo
nível de escopo já usado para `TipoPacote` (nenhuma das duas telas teve
edição/exclusão pedida).

**Rationale**: o negócio cria tipos de sessão novos com uma frequência que não
compensa depender de uma migration/deploy (ex.: a Patty decide oferecer uma
sessão de um equipamento novo). Manter o mesmo padrão de catálogo simples
(nome cadastrável) já usado para `TipoPacote` é mais consistente do que ter uma
regra (enum vs. tabela) diferente para dois conceitos vizinhos no mesmo domínio.

**Alternatives considered**: enum fixo (descartado — decisão original,
revertida por não atender à necessidade real de cadastro sem deploy); tabela de
tipo de sessão com edição/exclusão completas (descartado por ora — não foi
pedido, mesmo argumento de escopo já usado para `TipoPacote`).

## Decisão 2: Contador X/Y é calculado, não armazenado

**Decision**: o contador "realizado/contratado" de cada tipo de sessão dentro de
um ciclo é sempre calculado (`count` das sessões realizadas daquele tipo naquele
ciclo) no momento da leitura — não existe um campo `quantidadeRealizada` gravado
e incrementado manualmente.

**Rationale**: é exatamente o padrão já usado em `src/lib/desafios/conquistas.ts`
para contar marcações (`prisma.marcacaoItem.count(...)`) em vez de manter um
contador denormalizado. Evita o contador dessincronizar da lista real de
sessões marcadas — importante porque a US2 exige poder desfazer uma marcação
(FR-008): com contador calculado, desfazer é só apagar o registro da sessão, sem
precisar decrementar nada à parte.

**Alternatives considered**: campo `quantidadeRealizada` incrementado/decrementado
a cada marcação/desfazer — mais rápido de ler, mas introduz um segundo lugar
que pode ficar inconsistente com o histórico real; rejeitado por simplicidade e
para não duplicar a fonte de verdade.

## Decisão 3: Renovar reaproveita a mesma trava de "um ciclo ativo por vez" já usada em Desafios

**Decision**: vincular pacote e renovar pacote são a mesma operação de fundo —
criar um novo `CicloPacote` ativo para a cliente e arquivar (não deletar) o
ciclo ativo anterior, se existir, dentro de uma transação. Não existe uma ação
"renovar" tecnicamente distinta de "vincular"; a UI apenas rotula diferente
quando já existe um ciclo ativo.

**Rationale**: é o mesmo mecanismo de "no máximo um `ativo: true` por vez,
trocar em vez de acumular" já usado em `Desafio.ativo` (`criarDesafio` /
`encerrarDesafio` / `reabrirDesafio` em `src/app/painel/desafios/actions.ts`),
só que o escopo da unicidade é por cliente em vez de global. Reaproveitar a
mesma ideia (Princípio II) evita inventar um segundo modelo mental de "ciclo"
no mesmo projeto.

**Alternatives considered**: ação "renovar" separada que exige o ciclo atual já
estar com todas as sessões completas — rejeitada porque a spec (US3, Acceptance
Scenario 1) exige poder renovar independente do ciclo atual estar completo ou
não.

## Decisão 4: Onde a funcionalidade mora na árvore de rotas

**Decision**:
- Catálogo (`cadastro de tipos de pacote`, FR-001/002) → nova seção de topo do
  painel: `src/app/painel/pacotes/` (lista + formulário), com link novo no
  `SubNav` de `src/app/painel/layout.tsx`, ao lado de Aprovações/Membros/
  Vínculos/Desafios.
- Vincular pacote, contador, marcar/desfazer sessão, renovar e histórico
  (FR-003 a FR-011) → nova rota de detalhe por cliente:
  `src/app/painel/membros/[membroId]/`, linkada a partir de um novo botão/link
  em cada card da lista existente em `src/app/painel/membros/page.tsx`.

**Rationale**: a página `/perfil/[clienteId]` já existente é o perfil **público**
da cliente (visível pra ela mesma e mostra bio/emblemas/fotos/posts conforme
flags de privacidade) — não é uma tela exclusiva do painel, então não é o lugar
certo para ações administrativas como marcar sessão. `src/app/painel/membros/`
já é o lugar explicitamente pedido ("no painel de Membros"); como o pedido
envolve bastante informação por cliente (contador por tipo, botão de marcar,
histórico, renovar), uma rota de detalhe dedicada segue o mesmo padrão já usado
em `src/app/painel/desafios/[desafioId]/` para telas de administração
específicas de um recurso, em vez de inchar os cards da listagem atual.
`src/app/painel/pacotes/` é uma nova seção de catálogo, seguindo o mesmo padrão
de `src/app/painel/desafios/` (lista + formulário de criação, sem edição/exclusão
no v1, como a spec não pediu).

**Alternatives considered**: expandir os cards da listagem de Membros com um
acordeão contendo tudo — rejeitado por ser bastante conteúdo por card
(contadores + botão de marcar por tipo + histórico) numa lista que já tem várias
ações por linha; uma rota dedicada mantém a lista limpa e segue precedente já
existente no próprio projeto.

## Decisão 5: confirmação de substituição usa `BotaoComConfirmacao` (não um componente novo)

**Decision**: a confirmação exigida por FR-014 antes de arquivar um ciclo ativo
(vincular/renovar quando já existe ciclo ativo) reaproveita
`src/components/botao-com-confirmacao.tsx` — o mesmo componente já usado para
ações destrutivas no projeto (ex.: "Suspender" em `painel/membros/page.tsx`).
A mensagem de confirmação (`mensagemConfirmacao`) é montada dinamicamente em
`formulario-vincular-pacote.tsx` a partir do `cicloAtivo` já carregado pela
página (contador por tipo do ciclo atual), antes de chamar `vincularPacote`.

**Rationale**: `BotaoComConfirmacao` já aceita uma mensagem de confirmação
arbitrária (string) e uma ação — não precisa de nenhuma variação de API para
incluir os contadores; é só uma questão de montar a string certa. Criar um
componente de confirmação novo só para este fluxo duplicaria um padrão já
existente (Princípio II).

**Alternatives considered**: modal customizado mostrando os contadores em
tabela em vez de mensagem de texto — mais bonito, mas nenhum outro fluxo do
projeto usa modal de confirmação (todos usam `window.confirm` via
`BotaoComConfirmacao`); ficaria inconsistente com o resto do painel. Se no
futuro o projeto adotar modais de confirmação de forma geral, esse fluxo migra
junto.

## Escopo confirmado com o usuário antes deste plano (via `/speckit-specify`)

- Sessão além da quantidade contratada: bloqueada (FR-007).
- Uma cliente tem no máximo um ciclo ativo por vez (FR-004).
- Uma marcação pode ser desfeita, decrementando o contador calculado (FR-008).

Essas três decisões vieram de perguntas feitas ao usuário durante a
especificação (não são suposições deste plano).

## Decisões corrigidas pelo usuário durante a revisão deste plano

- Decisão 1 (acima): `TipoSessao` é catálogo cadastrável, não enum — reverte a
  decisão original deste plano.
- FR-014 / Decisão 5 (acima): confirmação explícita, mostrando o contador atual
  por tipo, é obrigatória antes de arquivar um ciclo ativo ao vincular/renovar —
  não estava no plano original; adicionado a pedido do usuário, com o
  Acceptance Scenario correspondente em `spec.md` (US3).
