# Data Model: Protocolo Completo de Medidas com Leitura por Parceria

Sem tabelas novas. Um único modelo alterado em `prisma/schema.prisma`
(contexto "Perfil"): `RegistroMedida` ganha campos novos. Nenhuma mudança em
`VinculoParceria` (contexto "Parcerias") — reaproveitado como está. Ver
research.md Decisões 1–4 para o raciocínio completo.

## `RegistroMedida` (existente) — campos novos

Estado atual, confirmado contra `prisma/schema.prisma:161-174` (não assumido):

```prisma
model RegistroMedida {
  id        String   @id @default(cuid())
  cliente   User     @relation(fields: [clienteId], references: [id], onDelete: Cascade)
  clienteId String
  data      DateTime @default(now())
  peso      Decimal? @db.Decimal(5, 2)
  cintura   Decimal? @db.Decimal(5, 2)
  quadril   Decimal? @db.Decimal(5, 2)
  braco     Decimal? @db.Decimal(5, 2)
  coxa      Decimal? @db.Decimal(5, 2)
  criadoEm  DateTime @default(now())

  @@index([clienteId, data])
}
```

Estado alvo — `braco`/`coxa` **preservados** (research.md Decisão 4), campos
novos adicionados:

```prisma
model RegistroMedida {
  id        String   @id @default(cuid())
  cliente   User     @relation(fields: [clienteId], references: [id], onDelete: Cascade)
  clienteId String
  data      DateTime @default(now())

  peso      Decimal? @db.Decimal(5, 2)
  altura    Decimal? @db.Decimal(5, 2)   // NOVO — cm, mesma precisão das demais

  // Tronco — um valor cada, sem lado (FR-001)
  ombro       Decimal? @db.Decimal(5, 2) // NOVO
  peitoBusto  Decimal? @db.Decimal(5, 2) // NOVO
  cintura     Decimal? @db.Decimal(5, 2) // existente
  abdomen     Decimal? @db.Decimal(5, 2) // NOVO
  quadril     Decimal? @db.Decimal(5, 2) // existente

  // Membro — bilateral, lado direito/esquerdo separados (FR-002)
  bracoDireito        Decimal? @db.Decimal(5, 2) // NOVO
  bracoEsquerdo       Decimal? @db.Decimal(5, 2) // NOVO
  antebracoDireito    Decimal? @db.Decimal(5, 2) // NOVO
  antebracoEsquerdo   Decimal? @db.Decimal(5, 2) // NOVO
  punhoDireito        Decimal? @db.Decimal(5, 2) // NOVO
  punhoEsquerdo       Decimal? @db.Decimal(5, 2) // NOVO
  coxaDireita         Decimal? @db.Decimal(5, 2) // NOVO
  coxaEsquerda        Decimal? @db.Decimal(5, 2) // NOVO
  joelhoDireito       Decimal? @db.Decimal(5, 2) // NOVO
  joelhoEsquerdo      Decimal? @db.Decimal(5, 2) // NOVO
  panturrilhaDireita  Decimal? @db.Decimal(5, 2) // NOVO
  panturrilhaEsquerda Decimal? @db.Decimal(5, 2) // NOVO
  tornozeloDireito    Decimal? @db.Decimal(5, 2) // NOVO
  tornozeloEsquerdo   Decimal? @db.Decimal(5, 2) // NOVO

  // Preservados, sem lado — só registros anteriores a esta feature continuam
  // preenchendo estes dois (research.md Decisão 4)
  braco     Decimal? @db.Decimal(5, 2)
  coxa      Decimal? @db.Decimal(5, 2)

  criadoEm  DateTime @default(now())

  @@index([clienteId, data])
}
```

- Todos os campos novos são `Decimal? @db.Decimal(5, 2)`, opcionais
  individualmente, mesma forma dos já existentes (FR-003).
- Nenhum campo tem `@default` além dos já existentes (`data`, `criadoEm`) —
  toda medida nasce `null` até a cliente preencher.
- `@@unique`/`@@index` inalterados — a chave de consulta continua
  `[clienteId, data]`.

## Sem migração de dados

Como todo campo novo é opcional e nasce `null`, e `braco`/`coxa` continuam
existindo sem alteração, nenhum registro histórico precisa de backfill:

| Registro | `braco`/`coxa` | Campos bilaterais novos | Campos de tronco novos (`ombro`/`peitoBusto`/`abdomen`) | `altura` |
|---|---|---|---|---|
| Criado antes desta feature | Valor já existente, sem lado | `null` (nunca preenchido) | `null` | `null` |
| Criado a partir desta feature | `null` (formulário não escreve mais aqui) | Preenchido conforme a cliente informar, por lado | Preenchido conforme a cliente informar | Preenchido conforme a cliente informar |

A regra "ao menos uma medida preenchida" (FR-004, já existente hoje) passa a
considerar a lista completa de campos — incluindo os novos — mas continua
sendo satisfeita por qualquer um deles, exatamente como hoje já é satisfeita
por qualquer um de `peso`/`cintura`/`quadril`/`braco`/`coxa`.

## Valor derivado para o gráfico de evolução (decisão fechada)

`GraficoEvolucao` (`src/app/cliente/medidas/grafico-evolucao.tsx`) não lê os
campos bilaterais direto — cada uma das 7 medidas de membro é reduzida a um
único ponto por data, calculado em `page.tsx` (onde `pontosGrafico` já é
montado hoje) com esta regra, por ordem de prioridade:

1. Lado direito **e** esquerdo preenchidos → média dos dois.
2. Só um dos lados preenchido → esse valor.
3. Nenhum dos dois preenchido, mas existe o campo legado equivalente
   (`braco`/`coxa`, só se aplica às duas medidas que já existiam) → o valor
   legado.
4. Nenhum dos três → `null` (sem ponto naquela data, mesmo comportamento de
   hoje para uma medida não preenchida).

Ver research.md Decisão 8 para o pseudocódigo (`valorMembro`) e o
detalhamento de por que a fórmula usa `braco`/`coxa` como fallback (mantém a
linha do gráfico contínua para registros anteriores a esta feature, sem
nenhuma migração de dado) e por que as outras 5 medidas de membro
(`antebraco`, `punho`, `joelho`, `panturrilha`, `tornozelo`) não têm esse
terceiro passo (nunca existiram antes desta feature). As 5 medidas de tronco
não passam por essa regra — são valor único, plotadas diretamente.

Esse cálculo é só de apresentação (no componente/página que monta os pontos
do gráfico) — não altera `RegistroMedida` nem nenhuma query: o histórico em
lista/tabela continua exibindo os valores brutos por campo (`bracoDireito`
separado de `bracoEsquerdo`), sem nenhuma agregação.

## Regra de negócio: vínculo continua controlando a leitura (sem mudança de modelo)

`VinculoParceria` (`prisma/schema.prisma:189-202`) não muda. A leitura de
`RegistroMedida` por uma parceria (FR-008–FR-011) é inteiramente uma regra de
consulta (query), não de schema: buscar o vínculo por
`clienteId_parceriaId` e checar `ativo: true` antes de retornar qualquer
`RegistroMedida` — mesma chave composta e mesmo campo já usados por
`enviarPlano` (`src/app/parceria/planos/actions.ts:33-40`).
