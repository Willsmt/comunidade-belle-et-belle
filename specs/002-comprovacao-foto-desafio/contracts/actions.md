# Contracts: Server Actions & Queries — Comprovação de Foto por Critério de Desafio

Aplicação Next.js (App Router) sem API pública separada — a interface real é
Server Actions + funções de query, no mesmo estilo já usado em
`src/app/painel/desafios/` e `src/app/cliente/desafios/`. Toda action roda
dentro de `executarAction`, checa o gate de acesso apropriado
(`requererAcessoPainel()` no painel, `requererPapel(["CLIENTE"])` na área da
cliente) e chama `revalidatePath` das rotas afetadas ao final.

## `src/app/painel/desafios/[desafioId]/actions.ts` (existente)

### `criarItem(categoriaId: string, formData: FormData): Promise<void>` — alterado
- **Input novo**: `exigeFoto` (checkbox, `"on"` ou ausente) além dos campos já
  existentes (`descricao`, `pontos`, `frequencia`).
- **Efeito**: cria `ItemDesafio` com `exigeFoto: formData.get("exigeFoto") === "on"`.
- Sem mudança de erros/revalidação em relação ao que já existe.

### `alternarExigeFoto(itemId: string): Promise<void>` — novo
- Sem campos de formulário — recebe o id direto, como `removerItem`.
- **Erros**: `AppError` se o item não existir.
- **Efeito**: inverte `exigeFoto` do item (`true → false`, `false → true`).
  Não afeta `MarcacaoItem` já existentes daquele item (FR data-model).
- **Revalida**: `/painel/desafios/${desafioId}` (via `item.categoria.desafioId`).

### `aprovarParticipacao` / `rejeitarParticipacao` — alteradas (Decisão 3)
- Mesma assinatura e erros de hoje.
- **Efeito novo**: além do que já faziam, apagam o `fotoChave` do R2 (via
  `deletarComprovante` de `comprovantes-surpresa.ts`) quando ele existir.
- **Revalida**: além do path que já revalidavam
  (`/painel/desafios/${desafioId}`), agora também `/painel/aprovacoes`.

## `src/app/painel/aprovacoes/actions.ts` (existente — dois novos exports)

### `aprovarMarcacaoItem(marcacaoId: string): Promise<void>`
- **Erros**: `AppError` se a marcação não existir ou já estiver `validado: true`.
- **Efeito**: atualiza a `MarcacaoItem` para `validado: true`,
  `validadoPor: session.user.id`, `validadoEm: now()`; apaga a foto do R2 (via
  `deletarComprovanteItem` de `comprovantes-item-desafio.ts`) e zera
  `fotoChave`; em seguida chama `verificarConquistasBonus` e
  `verificarConquistasRankingSemanal` para o `desafioId`/`clienteId` da
  marcação, usando a **data original da marcação** (research.md Decisão 7).
- **Revalida**: `/painel/aprovacoes` e `/cliente/desafios`.

### `rejeitarMarcacaoItem(marcacaoId: string): Promise<void>`
- **Erros**: `AppError` se a marcação não existir.
- **Efeito**: apaga a foto do R2 (se houver `fotoChave`) e depois `delete` da
  linha `MarcacaoItem` por completo (FR-010) — nenhum ponto é concedido.
- **Revalida**: `/painel/aprovacoes` e `/cliente/desafios` (o item volta a
  aparecer como "não marcado" pra cliente poder marcar de novo — FR-011).

### `aprovarConta` / `rejeitarConta` (existentes) — sem mudança de contrato.

## `src/app/painel/aprovacoes/queries.ts` (existente — um novo export)

### `listarComprovacoesPendentes(): Promise<{ itens: MarcacaoItemPendente[]; participacoesSurpresa: ParticipacaoPendente[] }>`
- `itens`: `MarcacaoItem` com `validado: false`, incluindo `item` (descrição,
  pontos, `categoria.desafio.titulo`), `cliente` (nome/email) e `fotoUrl`
  (assinada via `gerarUrlAssinada` de `comprovantes-item-desafio.ts`,
  a partir de `fotoChave`), ordenadas por `criadoEm asc`.
- `participacoesSurpresa`: `ParticipacaoSurpresa` com `validado: false`,
  incluindo `desafioSurpresa` (título, pontos) e `cliente`, com `fotoUrl`
  assinada quando `fotoChave` existir — mesma forma que
  `painel/desafios/[desafioId]/queries.ts` já monta hoje.
- `listarPendentes()` (contas) continua existindo sem mudança; a página passa
  a chamar as duas queries e renderizar as três listas juntas.

## `src/app/cliente/desafios/actions.ts` (existente)

### `alternarMarcacao(itemId: string): Promise<void>` — alterada
- **Erro novo**: `AppError` ("Esse item exige comprovação por foto — use o
  formulário de envio de foto") se `item.exigeFoto === true`. Sem nenhuma
  outra mudança de comportamento para itens sem `exigeFoto`.

### `marcarItemComFoto(itemId: string, formData: FormData): Promise<void>` — novo
- **Input**: `foto` (arquivo, obrigatório).
- **Erros**: `AppError` se `item.exigeFoto === false` (use `alternarMarcacao`);
  se já existir uma `MarcacaoItem` para esse item/cliente/dia (pendente ou
  aprovada — FR-006); se nenhum arquivo válido for enviado.
- **Efeito**: faz upload da foto (`comprovantes-item-desafio.ts`) e cria
  `MarcacaoItem` com `validado: false`, `fotoChave` = chave retornada. Não
  chama `verificarConquistasBonus`/`verificarConquistasRankingSemanal` (Decisão 7).
- **Revalida**: `/cliente/desafios`.

## `src/app/cliente/desafios/queries.ts` (existente)

### `obterDesafioAtivoParaCliente()` — alterado
- `itensMarcadosHoje` deixa de ser `Set<string>` (só o `itemId`) e passa a ser
  `Map<string, { validado: boolean }>`, pra a UI distinguir "marcado e
  pontuando" de "marcado, aguardando aprovação" (FR-012).
- O cálculo de ranking (`calcularRanking`) passa a filtrar `MarcacaoItem` por
  `validado: true`, igual ao filtro que `participacoesSurpresa` já usa
  (research.md Decisão 1/4).

## `src/lib/desafios/conquistas.ts` (existente)

### `calcularRankingParaConquista` / `regraSatisfeitaHoje` — alteradas
- Ambas passam a filtrar `MarcacaoItem` por `validado: true` nas suas
  contagens (research.md Decisão 4). Sem mudança de assinatura.

## `src/lib/storage/comprovantes-item-desafio.ts` (novo)

Mesma forma de `src/lib/storage/comprovantes-surpresa.ts` (research.md
Decisão 8):

- `validarArquivo(arquivo: File): void`
- `uploadComprovanteItem(arquivo: File, clienteId: string): Promise<string>`
  — chave `comprovantes-item/{clienteId}/{uuid}.webp`
- `gerarUrlAssinada(chave: string): Promise<string>` (re-export de `objetos.ts`)
- `deletarComprovanteItem(chave: string): Promise<void>`
