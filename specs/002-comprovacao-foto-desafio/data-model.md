# Data Model: Comprovação de Foto por Critério de Desafio

Sem tabelas novas — duas mudanças em modelos existentes de `prisma/schema.prisma`
(contexto "Desafios"). Ver research.md Decisão 1 para o porquê da forma
escolhida (espelha `DesafioSurpresa`/`ParticipacaoSurpresa`).

## `ItemDesafio` (existente) — campo novo

```prisma
model ItemDesafio {
  id          String           @id @default(cuid())
  categoria   CategoriaDesafio @relation(fields: [categoriaId], references: [id], onDelete: Cascade)
  categoriaId String
  descricao   String
  pontos      Int
  frequencia  FrequenciaItem   @default(DIARIO)
  exigeFoto   Boolean          @default(false)   // NOVO
  marcacoes   MarcacaoItem[]
  combos      RegraBonus[]     @relation("ComboItens")

  @@index([categoriaId])
}
```

- `exigeFoto`: opcional, item por item (FR-001, FR-002). `false` por padrão —
  todo item existente hoje continua sem exigência depois da migration.
- Alterar esse campo em um item já existente **não** recalcula marcações
  passadas (edge case da spec) — a leitura de `validado` de uma `MarcacaoItem`
  já criada não depende do valor atual de `exigeFoto` do item.

## `MarcacaoItem` (existente) — campos novos

```prisma
model MarcacaoItem {
  id          String      @id @default(cuid())
  item        ItemDesafio @relation(fields: [itemId], references: [id], onDelete: Cascade)
  itemId      String
  cliente     User        @relation(fields: [clienteId], references: [id], onDelete: Cascade)
  clienteId   String
  data        DateTime    @db.Date
  fotoChave   String?     // NOVO — chave do objeto no R2 enquanto pendente; null depois de aprovada ou se o item nunca exigiu foto
  validado    Boolean     @default(true)  // NOVO — true = conta no ranking/bônus; false = pendente de aprovação
  validadoPor String?     // NOVO — id de quem aprovou (session.user.id)
  validadoEm  DateTime?   // NOVO — quando foi aprovada
  criadoEm    DateTime    @default(now())

  @@unique([itemId, clienteId, data])
  @@index([clienteId, data])
}
```

- Mesmos quatro campos, mesmo significado que `ParticipacaoSurpresa` já usa
  para `fotoChave`/`validado`/`validadoPor`/`validadoEm`.
- `@@unique([itemId, clienteId, data])` continua garantindo no máximo uma
  marcação por item/cliente/dia — inclusive enquanto pendente (FR-006): uma
  segunda tentativa esbarra nessa constraint tanto quanto hoje.

### Estados de uma `MarcacaoItem`

| Situação | `validado` | `fotoChave` | Conta no ranking/bônus? | Como sai desse estado |
|---|---|---|---|---|
| Item sem `exigeFoto`, marcada | `true` (default) | `null` | Sim, na hora | `alternarMarcacao` desmarca (delete da linha) — inalterado |
| Item com `exigeFoto`, marcada, aguardando decisão | `false` | chave da foto enviada | Não | Patty aprova → linha abaixo; Patty rejeita → linha apagada por completo (FR-010/FR-011), cliente pode marcar de novo |
| Item com `exigeFoto`, aprovada | `true` | `null` (apagada do R2 na aprovação — FR-009) | Sim | Sem caminho de "desmarcar" depois de aprovada nesta feature |

Não existe um estado "rejeitada" persistido: rejeitar apaga o registro por
completo (FR-010), então o item volta a aparecer como "nunca marcado" para a
cliente.

## Sem migração de dados

Como `exigeFoto` nasce `false` e `validado` nasce `true` por padrão, toda
`MarcacaoItem` já existente no banco continua representando exatamente o que
representa hoje ("marcada e pontuando") sem nenhum backfill.
