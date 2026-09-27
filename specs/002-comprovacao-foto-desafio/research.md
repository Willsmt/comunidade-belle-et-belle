# Research: Comprovação de Foto por Critério de Desafio

Investigação do código existente antes do design (Fase 0), pra reaproveitar
padrões já estabelecidos (Princípio II) em vez de criar caminhos paralelos.

## Decisão 1 — Onde a exigência de foto e o estado de aprovação vivem no schema

**Decision**: `ItemDesafio` ganha `exigeFoto Boolean @default(false)`.
`MarcacaoItem` ganha `fotoChave String?`, `validado Boolean @default(true)`,
`validadoPor String?`, `validadoEm DateTime?` — exatamente os mesmos quatro
campos que `ParticipacaoSurpresa` já usa para `exigeComprovacao`/comprovação
pendente.

**Rationale**: `ParticipacaoSurpresa` (`prisma/schema.prisma:307`) já resolve
o mesmíssimo problema (comprovação opcional por instância + aprovação que
libera pontos) para desafio surpresa. Copiar a forma desses campos, em vez de
inventar um enum de status (`PENDENTE`/`APROVADO`/`REJEITADO`) ou uma tabela
separada de "comprovação", deixa os dois fluxos idênticos de se ler, testar e
consultar — e o `default(true)` em `validado` significa que toda marcação de
item **sem** `exigeFoto` nasce já "aprovada", preservando 100% do código atual
que soma pontos na hora, sem precisar de nenhum `if` novo nesse caminho.

**Alternatives considered**:
- Enum de status: mais explícito, mas exige migrar a leitura de "pontua ou
  não" (hoje é `validado: true` em `ParticipacaoSurpresa`) para dois formatos
  diferentes de filtro no mesmo domínio (Desafios). Rejeitado por
  inconsistência de padrão.
- Tabela separada `ComprovacaoItem` (1:1 com `MarcacaoItem`): replica a
  estrutura de `ParticipacaoSurpresa`/`DesafioSurpresa` (que são duas tabelas
  porque `DesafioSurpresa` é uma entidade própria, com título/pontos
  independentes de um "item"). Aqui `ItemDesafio` já é a entidade "própria";
  a marcação é o evento. Adicionar uma tabela a mais só pra guardar 4 campos
  que cabem direto na marcação seria complexidade sem ganho.

## Decisão 2 — Fila unificada em `/painel/aprovacoes`

**Decision**: `/painel/aprovacoes` passa a listar, na mesma tela,
`MarcacaoItem` pendentes (`validado: false`) e `ParticipacaoSurpresa`
pendentes (`validado: false`), cada uma com um botão aprovar/rejeitar. As
actions de aprovar/rejeitar participação de desafio surpresa
(`aprovarParticipacao`/`rejeitarParticipacao`, hoje em
`painel/desafios/[desafioId]/actions.ts`) continuam definidas ali (evita
duplicar a lógica — Princípio II) e passam a também ser chamadas a partir de
`/painel/aprovacoes` — Server Actions podem ser importadas entre arquivos de
rota sem problema. As duas actions passam a `revalidatePath("/painel/aprovacoes")`
além do path que já revalidavam.

Os botões de aprovar/rejeitar **saem** de `painel/desafios/[desafioId]/page.tsx`
— a lista de participações continua lá (histórico, com badge "Pendente" /
"Aprovada"), mas só decide-se em `/painel/aprovacoes`, pra não ter dois lugares
de onde a mesma ação é disparada (o próprio Princípio II fala em evitar "dois
caminhos" para o mesmo propósito, mesmo quando o código por trás é
reaproveitado).

**Rationale**: é exatamente o que a spec pede ("Aprovação/rejeição fica na aba
/painel/aprovacoes — unificada com desafio surpresa"). Reaproveitar as actions
existentes em vez de recriá-las em `painel/aprovacoes/actions.ts` evita ter
duas implementações de "aprovar participação de desafio surpresa".

**Alternatives considered**: mover as actions para
`painel/aprovacoes/actions.ts` — rejeitado porque quebraria os testes já
existentes em `painel/desafios/[desafioId]/actions.test.ts` sem nenhum ganho
(o import cross-rota já resolve a unificação de UI sem mexer em onde a lógica
mora).

## Decisão 3 — Limpeza de storage também para desafio surpresa

**Decision**: `aprovarParticipacao` e `rejeitarParticipacao` passam a apagar o
`fotoChave` do R2 (via `deletarComprovante`) quando existir — hoje elas **não**
fazem isso (só mudam `validado` ou deletam a linha, deixando o objeto órfão no
R2). O mesmo vale para os novos `aprovarMarcacaoItem`/`rejeitarMarcacaoItem`.

**Rationale**: a spec descreve esse comportamento ("aprovar libera os pontos E
apaga a foto do R2, pra não acumular storage") no contexto da mesma tela
unificada onde as duas coisas (item e desafio surpresa) vão ser decididas lado
a lado; deixar só uma das duas limpando storage seria inconsistente na mesma
tela e manteria o problema de storage que a spec pede explicitamente para
resolver. É uma mudança pequena e local (2 linhas por função, mesmo arquivo
que já está sendo tocado pela Decisão 2), não uma reescrita.

**Chamando atenção**: isso estende o comportamento de uma feature já existente
(desafio surpresa) além do que a spec original de item-com-foto pedia
literalmente. Registrado aqui para review explícita — se a Patty preferir que
o comportamento de desafio surpresa fique como está hoje (sem apagar foto),
essa parte é isolada e pode ser revertida sem afetar o resto do plano.

## Decisão 4 — Regras de bônus/ranking por emblema também respeitam `validado`

**Decision**: os dois pontos em `src/lib/desafios/conquistas.ts` que hoje
contam `MarcacaoItem` sem filtrar por aprovação —
`calcularRankingParaConquista` (usada pelos emblemas de ranking semanal/geral)
e `regraSatisfeitaHoje` (usada pelos bônus de limiar diário, combo e categoria
completa) — passam a filtrar `validado: true`, igual ao ranking visível do
cliente (`src/app/cliente/desafios/queries.ts`).

**Rationale**: a spec exige que os pontos de um item com "exige foto" fiquem
"bloqueados — não somam no ranking — até a Patty aprovar". O ranking visível
já ia respeitar isso (Decisão 1), mas os bônus/emblemas leem `MarcacaoItem`
direto, sem esse filtro — sem essa mudança, uma cliente poderia marcar um item
pendente (sem aprovação) e ainda assim disparar um combo, limiar diário ou
emblema de ranking, o que contradiz "bloqueados" da spec. Sem essa correção, a
trava de pontos teria um furo.

**Chamando atenção**: assim como a Decisão 3, isso toca um arquivo fora do
escopo literal da spec (`conquistas.ts`, que hoje serve tanto Desafios comuns
quanto desafio surpresa). É necessário pra a garantia "bloqueados" valer de
ponta a ponta; sinalizado aqui por tocar lógica compartilhada.

## Decisão 5 — Como a Patty ativa "exige foto" num item já existente

**Decision**: novo botão de alternância `BotaoAlternarExigeFoto` +ação
`alternarExigeFoto(itemId)`, no mesmo padrão de `BotaoReabrirDesafio`/
`reabrirDesafio` (toggle de um único campo booleano, sem formulário), em vez
de construir uma tela de "editar item" completa. `FormularioCriarItem` ganha
um checkbox "Exige foto" (default desmarcado) pra quando o item é criado.

**Rationale**: hoje `ItemDesafio` só tem `criarItem`/`removerItem` — não existe
nenhuma forma de editar um item já criado (nem descrição, nem pontos, nem
frequência). Construir uma tela de edição genérica pra viabilizar só o toggle
de `exigeFoto` seria escopo muito maior que o pedido. Um botão de alternância
dedicado resolve o cenário de aceitação da spec ("a Patty edita o item e ativa
a opção") sem introduzir edição genérica de item — mesmo padrão já usado em
`alternarMarcacao` e `reabrirDesafio`.

**Alternatives considered**: tela de edição completa do item — rejeitada por
introduzir escopo (editar descrição/pontos/frequência) que ninguém pediu.

## Decisão 6 — Fluxo de marcação da cliente se divide em dois caminhos

**Decision**: `alternarMarcacao(itemId)` (já existente) passa a rejeitar, com
`AppError`, a tentativa de marcar um item com `exigeFoto: true` (ela continua
sendo o caminho de toggle marcar/desmarcar pros itens sem exigência — nenhuma
mudança de comportamento pra eles). Um novo `marcarItemComFoto(itemId,
formData)` cobre exclusivamente itens com `exigeFoto: true`: exige um arquivo
de foto no `formData`, cria a `MarcacaoItem` com `validado: false` e
`fotoChave` (sem chamar `verificarConquistasBonus`/`verificarConquistasRankingSemanal`
nesse momento — ver Decisão 7), e não permite "desmarcar" (não há delete nesse
caminho; a única forma de a marcação sumir antes de aprovada é a Patty
rejeitar). No componente, `BotaoMarcarItem` continua para itens sem exigência;
um novo `FormularioMarcarItemComFoto` (mesmo padrão de
`FormularioParticiparSurpresa`: `<input type="file">` + submit) cobre os que
exigem.

**Rationale**: reaproveita a mesma divisão dois-componentes/duas-actions que
`participarDesafioSurpresa` já usa para instâncias com/sem `exigeComprovacao`,
em vez de inflar `alternarMarcacao` com um `if` de upload de arquivo dentro de
uma função de toggle simples.

## Decisão 7 — Quando verificar bônus/emblemas pra item com foto

**Decision**: `verificarConquistasBonus`/`verificarConquistasRankingSemanal`
não são chamadas em `marcarItemComFoto` (a marcação nasce `validado: false`,
não pode satisfazer nenhuma regra filtrada por `validado: true` — chamar seria
trabalho à toa). Elas passam a ser chamadas dentro de `aprovarMarcacaoItem`,
usando a **data original da marcação** (`marcacao.data`, não a data de hoje) —
as duas funções já aceitam `hoje: Date` como parâmetro, então isso não muda
assinatura nenhuma.

**Rationale**: é só na aprovação que a marcação passa a valer pra bônus (
Decisão 4); rodar a verificação nesse momento, com a data em que o item foi de
fato marcado, é o que faz um combo/limiar daquele dia específico (possivelmente
diferente do dia em que a Patty aprova) ser reconhecido corretamente.

## Decisão 8 — Pipeline de upload/compressão de foto

**Decision**: novo módulo `src/lib/storage/comprovantes-item-desafio.ts`,
cópia estrutural de `src/lib/storage/comprovantes-surpresa.ts` (mesma
validação de tipo/tamanho via `comprimirImagem`, mesmo `uploadObjeto`/
`deletarObjeto`/`gerarUrlAssinada` de `objetos.ts`), só com um prefixo de
chave próprio (`comprovantes-item/{clienteId}/{uuid}.webp`).

**Rationale**: é exatamente o pipeline que a spec pede ("mesmo pipeline de
compressão/R2 já usado"). O projeto já tem essa forma repetida uma vez por
contexto (`comprovantes-surpresa.ts`, `jornada-desafio.ts`, `fotos.ts`,
`parcerias.ts`, `perfil.ts`, `planos.ts`) — nenhuma dessas é genérica o
bastante pra importar diretamente (cada uma tem seu próprio prefixo de chave e
call sites tipados pro seu contexto), então seguir o padrão existente
(um arquivo fino por contexto sobre o mesmo `objetos.ts`) é reaproveitar a
convenção, não duplicar uma abstração nova.

**Alternatives considered**: parametrizar um único módulo de "comprovante" com
o prefixo como argumento, cobrindo surpresa + item — rejeitado por ser uma
refatoração de um arquivo fora do escopo desta feature (`comprovantes-surpresa.ts`)
só pra economizar ~15 linhas repetidas, contra o Princípio IV (escopo local).
