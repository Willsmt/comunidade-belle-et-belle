# Data Model: Pacotes de Sessões

Convenções seguidas: nomes de model/campo em português, como o restante do
`schema.prisma`; `cuid()` como id; `criadoEm DateTime @default(now())` nos
registros de log/criação, como já usado em todo o schema.

> **Revisão**: `TipoSessao` era um enum na primeira versão deste documento. O
> usuário decidiu, antes da geração de `tasks.md`, que precisa cadastrar novos
> tipos de sessão pelo painel sem depender de deploy — ver research.md
> Decisão 1 (revisada). Esta versão já reflete `TipoSessao` como model/catálogo,
> referenciado por FK onde antes havia o enum.

## `TipoSessao`

Catálogo cadastrado pela Patty — categoria de sessão reutilizável entre vários
tipos de pacote (ex.: "Aplicação", "Radiofrequência", "Ultrassom"). Suporta
criar, editar (nome), excluir (arquiva se em uso, apaga se nunca usado — ver
FR-016/FR-017) e reativar.

| Campo      | Tipo              | Notas                                   |
|------------|--------------------|------------------------------------------|
| `id`       | `String @id @default(cuid())` |                            |
| `nome`     | `String @unique`  | Ex.: "Aplicação"                          |
| `ativo`    | `Boolean @default(true)` | `false` = arquivado (excluído com uso — FR-016); oculto das opções de seleção, mas mantido para não quebrar histórico |
| `itensTipoPacote`  | `ItemTipoPacote[]` |                                    |
| `itensCicloPacote` | `ItemCicloPacote[]` |                                   |
| `sessoesRealizadas`| `SessaoRealizada[]` |                                   |
| `criadoEm` | `DateTime @default(now())` |                                  |

Validação (na action de criação): `nome` não vazio; `@@unique` no banco cobre
duplicidade de nome.

## `TipoPacote`

Catálogo cadastrado pela Patty (FR-001, FR-002). Reutilizável entre várias
clientes/ciclos. Suporta criar, editar (nome e composição — troca segura por
causa do snapshot em `ItemCicloPacote`, FR-013/FR-015), excluir (arquiva se em
uso, apaga se nunca vinculado a nenhuma cliente — FR-016/FR-017) e reativar.

| Campo      | Tipo              | Notas                                   |
|------------|--------------------|------------------------------------------|
| `id`       | `String @id @default(cuid())` |                            |
| `nome`     | `String`           | Ex.: "Projeto Corpo dos Sonhos"          |
| `ativo`    | `Boolean @default(true)` | `false` = arquivado (excluído com uso — FR-016); oculto do seletor de vincular/renovar, mas mantido para não quebrar histórico |
| `itens`    | `ItemTipoPacote[]` | Composição — ver abaixo                  |
| `ciclos`   | `CicloPacote[]`    | Ciclos já criados a partir deste tipo    |
| `criadoEm` | `DateTime @default(now())` |                                  |

Validação (nível de aplicação, na action de criação/edição — não constraint de
banco, seguindo o mesmo estilo de `criarDesafio`): `itens` não pode ser vazio
(FR-002); cada item precisa de `quantidade >= 1`.

**Exclusão (FR-016/FR-017)**: "em uso" = existe ao menos um `CicloPacote` com
esse `tipoPacoteId` (qualquer cliente, ativo ou arquivado). Se em uso →
`ativo: false`. Se não → `delete` (cascata remove `ItemTipoPacote`
automaticamente, já que nada mais referencia esse `TipoPacote`).

## `ItemTipoPacote`

Uma linha da composição do catálogo: um tipo de sessão + quantidade.

| Campo          | Tipo         | Notas                                        |
|----------------|--------------|------------------------------------------------|
| `id`           | `String @id @default(cuid())` |                              |
| `tipoPacote`   | `TipoPacote @relation(..., onDelete: Cascade)` |             |
| `tipoPacoteId` | `String`     |                                                |
| `tipoSessao`   | `TipoSessao @relation(fields: [tipoSessaoId], references: [id])` | FK — antes era enum |
| `tipoSessaoId` | `String`     |                                                |
| `quantidade`   | `Int`        | Quantidade contratada para esse tipo, `>= 1`  |

`@@unique([tipoPacoteId, tipoSessaoId])` — não repete o mesmo tipo de sessão
duas vezes dentro do mesmo tipo de pacote.

## `CicloPacote`

Vínculo entre uma cliente e um tipo de pacote — um "ciclo" (FR-003, FR-009).
Guarda sua própria cópia do nome do pacote (FR-013: renomear o `TipoPacote`
depois não deve alterar ciclos já criados).

| Campo          | Tipo                      | Notas                                          |
|----------------|---------------------------|--------------------------------------------------|
| `id`           | `String @id @default(cuid())` |                                              |
| `cliente`      | `User @relation(..., onDelete: Cascade)` |                                    |
| `clienteId`    | `String`                  |                                                  |
| `tipoPacote`   | `TipoPacote @relation(fields: [tipoPacoteId], references: [id])` | Referência informativa (de qual catálogo veio) |
| `tipoPacoteId` | `String`                  |                                                  |
| `nomePacote`   | `String`                  | Snapshot do nome no momento do vínculo/renovação |
| `itens`        | `ItemCicloPacote[]`       | Snapshot da composição — ver abaixo             |
| `sessoes`      | `SessaoRealizada[]`       |                                                  |
| `ativo`        | `Boolean @default(true)`  | No máximo um `true` por `clienteId`             |
| `criadoEm`     | `DateTime @default(now())`|                                                  |
| `arquivadoEm`  | `DateTime?`                | Preenchido quando um novo ciclo o substitui     |

`@@index([clienteId, ativo])` — mesmo padrão de índice usado em `Desafio.ativo`,
adaptado para a busca ser por cliente.

**Invariante (aplicada na action, dentro de uma transação Prisma, não como
constraint de banco — mesmo estilo de `criarDesafio`/`reabrirDesafio`)**: ao
criar um novo `CicloPacote` com `ativo: true` para uma `clienteId`, qualquer
ciclo existente com `ativo: true` da mesma cliente é atualizado para
`ativo: false, arquivadoEm: now()` na mesma transação. Nunca existem dois
`ativo: true` simultâneos para a mesma cliente.

**Confirmação obrigatória antes da troca (FR-014)**: essa substituição só
acontece depois que a Patty confirma explicitamente, num diálogo que mostra o
contador por tipo do ciclo atual (ver contracts/actions.md e research.md
Decisão 5). A confirmação é responsabilidade da UI (`BotaoComConfirmacao`) —
a action `vincularPacote` em si não pede confirmação de novo; ela assume que,
ao ser chamada, a confirmação já aconteceu no client.

## `ItemCicloPacote`

Snapshot de uma linha da composição do pacote, copiada do `ItemTipoPacote` no
momento em que o ciclo foi criado (FR-013).

| Campo                 | Tipo             | Notas                                    |
|-----------------------|------------------|--------------------------------------------|
| `id`                  | `String @id @default(cuid())` |                            |
| `cicloPacote`         | `CicloPacote @relation(..., onDelete: Cascade)` |            |
| `cicloPacoteId`       | `String`         |                                            |
| `tipoSessao`          | `TipoSessao @relation(fields: [tipoSessaoId], references: [id])` | FK — antes era enum |
| `tipoSessaoId`        | `String`         |                                            |
| `quantidadeContratada`| `Int`            | Copiado de `ItemTipoPacote.quantidade`    |

`@@unique([cicloPacoteId, tipoSessaoId])`.

O "realizado" (X de X/Y) **não é um campo aqui** — é `SessaoRealizada.count()`
filtrado por `cicloPacoteId` + `tipoSessaoId` (ver research.md Decisão 2).

## `SessaoRealizada`

Uma marcação de sessão feita (FR-006), com data, e a fonte de verdade do
histórico (FR-011) e do contador.

| Campo         | Tipo                        | Notas                                    |
|---------------|-----------------------------|--------------------------------------------|
| `id`          | `String @id @default(cuid())` |                                          |
| `cicloPacote` | `CicloPacote @relation(..., onDelete: Cascade)` |                        |
| `cicloPacoteId`| `String`                   |                                            |
| `tipoSessao`  | `TipoSessao @relation(fields: [tipoSessaoId], references: [id])` | FK — antes era enum; precisa existir em `ItemCicloPacote` do mesmo ciclo (validado na action) |
| `tipoSessaoId`| `String`                    |                                            |
| `data`        | `DateTime @db.Date`         | Data da sessão/marcação, mesmo tipo de campo usado em `MarcacaoItem.data` |
| `marcadoPor`  | `User @relation(fields: [marcadoPorId], references: [id])` | Quem marcou (auditoria) |
| `marcadoPorId`| `String`                    |                                            |
| `criadoEm`    | `DateTime @default(now())`  |                                            |

`@@index([cicloPacoteId, tipoSessaoId])`.

Desfazer (FR-008) = `delete` direto de uma linha específica desta tabela —
independente de arquivamento de ciclo, que nunca deleta nada (FR-010).

## Regras de validação central (aplicadas nas Server Actions)

1. Criar `TipoSessao`: `nome` não vazio e ainda não usado (constraint
   `@@unique` cobre; a action traduz erro de unicidade do Prisma numa
   `AppError` amigável).
2. Criar `TipoPacote`: `nome` não vazio; `itens.length >= 1`; cada
   `quantidade >= 1`; sem `tipoSessaoId` repetido na lista; cada
   `tipoSessaoId` precisa existir em `TipoSessao`.
3. Vincular/renovar (`vincularPacote`): exige confirmação explícita da Patty
   quando já existe ciclo ativo (FR-014, ver `CicloPacote` acima); cria
   `CicloPacote` + `ItemCicloPacote[]` copiando de um `TipoPacote` existente;
   arquiva o ciclo ativo anterior da mesma cliente, se existir — tudo em uma
   transação.
4. Marcar sessão (`marcarSessaoRealizada`): o `cicloPacote` de destino precisa
   estar `ativo: true`; o `tipoSessaoId` precisa ter uma linha em
   `ItemCicloPacote` desse ciclo; `count(SessaoRealizada) < quantidadeContratada`
   para aquele tipo — senão `AppError` (FR-007).
5. Desfazer sessão (`desfazerSessaoRealizada`): qualquer `SessaoRealizada` do
   ciclo pode ser removida (não só a mais recente), sem restrição adicional.

## Diagrama de relações

```
TipoSessao 1---N ItemTipoPacote
TipoSessao 1---N ItemCicloPacote
TipoSessao 1---N SessaoRealizada
TipoPacote 1---N ItemTipoPacote
TipoPacote 1---N CicloPacote (informativo, snapshot já copiado)
User(cliente) 1---N CicloPacote
CicloPacote 1---N ItemCicloPacote
CicloPacote 1---N SessaoRealizada
User(marcadoPor) 1---N SessaoRealizada
```
