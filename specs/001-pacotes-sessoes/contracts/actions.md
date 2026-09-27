# Contracts: Server Actions & Queries — Pacotes de Sessões

Este projeto é uma aplicação Next.js (App Router) sem API pública separada; a
interface real entre UI e servidor são as Server Actions e funções de query
usadas pelos Server Components, no mesmo estilo já usado em
`src/app/painel/desafios/` e `src/app/painel/membros/`. Todas as actions:
- rodam dentro de `executarAction` (mapeia erro para mensagem amigável);
- chamam `requererAcessoPainel()` antes de tocar no banco (FR-012);
- chamam `revalidatePath` da rota afetada ao final.

`tipoSessao` em toda a interface abaixo é `tipoSessaoId: string` (FK para o
catálogo `TipoSessao` — ver research.md Decisão 1 revisada e data-model.md).

## `src/app/painel/pacotes/actions.ts`

### `criarTipoSessao(formData: FormData): Promise<void>`
- **Input**: `nome` (string).
- **Erros**: `AppError` se `nome` vazio ou já existente (constraint `@@unique`
  traduzida para mensagem amigável).
- **Efeito**: cria `TipoSessao`.
- **Revalida**: `/painel/pacotes`.

### `editarTipoSessao(formData: FormData): Promise<void>`
- **Input**: `id` (string); `nome` (string).
- **Erros**: `AppError` se `id` ausente, `nome` vazio, ou nome já existente em
  outro `TipoSessao`.
- **Efeito**: atualiza `nome`. Não afeta ciclos já criados (FR-015).
- **Revalida**: `/painel/pacotes`.

### `excluirTipoSessao(id: string): Promise<void>`
- Sem campos de formulário — recebe o id direto, como `suspenderMembro`.
- **Efeito**: se `id` estiver referenciado em algum `ItemTipoPacote`,
  `ItemCicloPacote` ou `SessaoRealizada` (qualquer cliente), marca
  `ativo: false` (arquiva — FR-016); senão, `delete` de verdade (FR-017).
- **Revalida**: `/painel/pacotes`.

### `reativarTipoSessao(id: string): Promise<void>`
- **Efeito**: marca `ativo: true` (FR-018).
- **Revalida**: `/painel/pacotes`.

### `criarTipoPacote(formData: FormData): Promise<void>`
- **Input**: `nome` (string); um campo `quantidade-{tipoSessaoId}` por linha do
  catálogo de `TipoSessao` mostrada no formulário — em branco significa "não
  incluído" (não há índice de array; a implementação real ficou mais simples
  que a descrita na primeira versão deste contrato, que usava
  `itens[0][tipoSessaoId]`).
- **Erros**: `AppError` se `nome` vazio, se nenhuma linha tiver quantidade
  preenchida, se algum valor preenchido for `< 1`, se houver `tipoSessaoId`
  repetido (via `FormData.append` — não alcançável pela UI normal, só defesa),
  ou se algum `tipoSessaoId` não existir mais.
- **Efeito**: cria `TipoPacote` + `ItemTipoPacote[]` numa transação.
- **Revalida**: `/painel/pacotes`.

### `editarTipoPacote(formData: FormData): Promise<void>`
- **Input**: `id` (string); `nome` (string); mesmos campos
  `quantidade-{tipoSessaoId}` de `criarTipoPacote` — a composição enviada
  **substitui** a anterior (linhas omitidas saem do pacote).
- **Erros**: mesmos de `criarTipoPacote`, mais `AppError` se `id` não existir.
- **Efeito** (transação): apaga todos os `ItemTipoPacote` atuais e recria a
  partir do que foi enviado, junto com o `nome`. Seguro por causa do snapshot
  em `ItemCicloPacote` — nenhum ciclo já criado é afetado (FR-013/FR-015).
- **Revalida**: `/painel/pacotes`.

### `excluirTipoPacote(id: string): Promise<void>`
- **Efeito**: se `id` estiver referenciado em algum `CicloPacote` (qualquer
  cliente, ativo ou arquivado), marca `ativo: false` (arquiva — FR-016);
  senão, `delete` de verdade, cascata remove `ItemTipoPacote` (FR-017).
- **Revalida**: `/painel/pacotes`.

### `reativarTipoPacote(id: string): Promise<void>`
- **Efeito**: marca `ativo: true` (FR-018).
- **Revalida**: `/painel/pacotes`.

## `src/app/painel/pacotes/queries.ts`

### `listarTiposSessao(): Promise<TipoSessao[]>`
Lista **todos** os tipos de sessão cadastrados (ativos e arquivados, com o
campo `ativo`), ordenados por `nome asc` — quem chama decide o que mostrar.
A tela de catálogo (`painel/pacotes/page.tsx`) mostra todos, com badge
"Arquivado" nos inativos; o formulário de criar tipo de pacote e o de
vincular/renovar em `painel/membros/[membroId]` filtram para `ativo: true`
antes de montar as opções do seletor (exceto o formulário de **editar** um
tipo de pacote, que também inclui um tipo de sessão arquivado se ele já fizer
parte da composição sendo editada — para não removê-lo em silêncio).

### `listarTiposPacote(): Promise<TipoPacoteComItens[]>`
Lista **todos** os tipos de pacote (ativos e arquivados, com o campo `ativo`)
com sua composição (`itens`, cada um com o `tipoSessao` relacionado incluído),
ordenados por `criadoEm desc`. Mesma regra de filtragem por quem chama descrita
acima para `listarTiposSessao()`.

## `src/app/painel/membros/[membroId]/actions.ts`

### `vincularPacote(clienteId: string, tipoPacoteId: string): Promise<void>`
- Cobre tanto "vincular" (cliente sem ciclo ativo) quanto "renovar" (cliente já
  tem ciclo ativo) — mesma operação de fundo (ver research.md Decisão 3).
- **Pré-condição de UI (FR-014)**: quando já existe ciclo ativo, o client MUST
  ter mostrado a confirmação com o contador atual por tipo e o usuário MUST ter
  confirmado antes desta action ser chamada (via `BotaoComConfirmacao` — ver
  research.md Decisão 5). A action não reexibe confirmação; ela apenas executa.
- **Erros**: `AppError` se `tipoPacoteId` não existir.
- **Efeito** (transação): se existir `CicloPacote` `ativo: true` para
  `clienteId`, atualiza para `ativo: false, arquivadoEm: now()`; cria um novo
  `CicloPacote` (`ativo: true`, `nomePacote` = snapshot do nome atual do
  `TipoPacote`) com `ItemCicloPacote[]` copiado de `ItemTipoPacote[]`.
- **Revalida**: `/painel/membros/[membroId]`.

### `marcarSessaoRealizada(cicloPacoteId: string, tipoSessaoId: string, data?: string): Promise<void>`
- `data` opcional — se omitida, usa a data de hoje (mesmo padrão de
  `obterDataDeHoje()` usado em Desafios).
- **Erros**: `AppError` se o ciclo não estiver ativo; se `tipoSessaoId` não
  fizer parte da composição do ciclo; se `count(SessaoRealizada) >= quantidadeContratada`
  para aquele tipo (FR-007).
- **Efeito**: cria uma linha em `SessaoRealizada` com `marcadoPorId` = usuário
  autenticado.
- **Revalida**: `/painel/membros/[membroId]`.

### `desfazerSessaoRealizada(sessaoRealizadaId: string): Promise<void>`
- **Erros**: `AppError` se o registro não existir.
- **Efeito**: `delete` da linha em `SessaoRealizada` (qualquer uma, não só a
  mais recente — FR-008).
- **Revalida**: `/painel/membros/[membroId]`.

## `src/app/painel/membros/[membroId]/queries.ts`

### `obterCicloAtivo(clienteId: string): Promise<CicloAtivoComContadores | null>`
Retorna o `CicloPacote` `ativo: true` da cliente (ou `null`), com, para cada
`ItemCicloPacote`: `tipoSessao` (nome, via relação), `quantidadeContratada`, e
`quantidadeRealizada` (calculado via `SessaoRealizada.count`, não armazenado —
research.md Decisão 2). Usado também para montar a mensagem de confirmação de
FR-014 antes de vincular/renovar.

### `listarHistoricoCiclos(clienteId: string): Promise<CicloHistoricoComSessoes[]>`
Retorna todos os `CicloPacote` da cliente (ativos e arquivados) com suas
`SessaoRealizada[]` (tipo + data), ordenados por `criadoEm desc`, para a seção
de histórico (FR-011) — inclui o ciclo ativo atual e os arquivados.
