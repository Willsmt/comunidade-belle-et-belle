# Research: Protocolo Completo de Medidas com Leitura por Parceria

Investigação do código existente antes do design (Fase 0), pra reaproveitar
padrões já estabelecidos (Princípio II) em vez de criar caminhos paralelos.

## Decisão 1 — Onde os campos novos vivem no schema

**Decision**: os campos de tronco e de membro entram direto em
`RegistroMedida` (existente), como colunas `Decimal?` adicionais — mesmo
formato que `peso`/`cintura`/`quadril`/`braco`/`coxa` já usam hoje
(`prisma/schema.prisma:161`). Nenhuma tabela nova.

**Rationale**: é exatamente o que a spec pede ("adicionar ao model já
existente"). `RegistroMedida` já representa "uma cliente, numa data, com um
conjunto de medidas opcionais" — os campos novos são a mesma coisa, só mais
deles. Uma tabela separada por grupo (tronco/membro) exigiria juntar várias
linhas por data numa consulta que hoje é uma linha só, sem nenhum ganho.

## Decisão 2 — Confirmação dos campos que já existem hoje

**Decision**: confirmado contra `prisma/schema.prisma:161-174` (não assumido
pelo texto do pedido) que `RegistroMedida` hoje tem apenas `peso`, `cintura`,
`quadril`, `braco`, `coxa` — **`altura` não existe**. `braco` e `coxa` são
valor único, sem lado.

**Rationale**: essa checagem evita duas armadilhas: (1) tratar `altura` como
"já existente" e pular sua migration; (2) tentar migrar `braco`/`coxa` como se
já fossem bilaterais. Ver spec.md → Assumptions, já corrigido nesse sentido
antes desta fase.

## Decisão 3 — Convenção de nome para os campos bilaterais

**Decision**: sufixo por lado, respeitando o gênero gramatical de cada medida
em português, camelCase — mesma convenção já usada no schema (`fotoChave`,
`criadoEm`, sem acento em `abdomen`/`panturrilha` como já não há em `braco`):

| Medida | Campo lado direito | Campo lado esquerdo |
|---|---|---|
| Braço | `bracoDireito` | `bracoEsquerdo` |
| Antebraço | `antebracoDireito` | `antebracoEsquerdo` |
| Punho | `punhoDireito` | `punhoEsquerdo` |
| Coxa | `coxaDireita` | `coxaEsquerda` |
| Joelho | `joelhoDireito` | `joelhoEsquerdo` |
| Panturrilha | `panturrilhaDireita` | `panturrilhaEsquerda` |
| Tornozelo | `tornozeloDireito` | `tornozeloEsquerdo` |

**Alternatives considered**: um campo estruturado único por medida (ex.: JSON
`{ direito, esquerdo }`) — rejeitado porque o projeto não usa campos JSON em
nenhum outro lugar do schema pra esse tipo de dado tabular/decimal, e
quebraria a leitura direta via Prisma (`medida.bracoDireito`) que o resto do
código já faz para campos decimais simples.

## Decisão 4 — `braco`/`coxa` existentes não são migrados, só preservados

**Decision**: as colunas `braco` e `coxa` **continuam existindo** no schema,
intocadas. O formulário novo (US1) para de escrever nelas — todo registro
criado a partir desta feature usa só os campos bilaterais
(`bracoDireito`/`bracoEsquerdo`, `coxaDireita`/`coxaEsquerda`). Registros
antigos continuam com `braco`/`coxa` preenchidos, sem lado.

**Rationale**: é a leitura mais direta da spec ("registros antigos... não são
reclassificados retroativamente"). Como `Decimal?` já é opcional, não é
necessário nenhum backfill: um registro antigo simplesmente não preenche os
campos bilaterais novos, e um registro novo não preenche mais `braco`/`coxa`
— cada linha do histórico continua representando fielmente o que foi medido
naquele dia (FR-006, SC-002). Renomear ou remover `braco`/`coxa` exigiria
decidir o que fazer com dado histórico real de clientes de produção — decisão
de maior risco e reversibilidade menor, fora do que a spec pediu.

**Impacto em `GraficoEvolucao`**: como o formulário novo não escreve mais em
`braco`/`coxa`, as duas linhas do gráfico que hoje leem esses campos
precisariam de uma fonte nova de dado — decisão fechada e detalhada na
Decisão 8.

## Decisão 5 — Estrutura de rota da parceria: lista → detalhe, não página única

**Decision**: duas rotas novas, no padrão dinâmico já usado em
`src/app/painel/membros/[membroId]/`:
- `/parceria/medidas` — lista as clientes vinculadas (reaproveitando
  `listarClientesVinculadas` de `../planos/queries`), cada uma como link.
- `/parceria/medidas/[clienteId]` — histórico completo de medidas daquela
  cliente específica, somente leitura.

**Rationale**: a spec deixou a decisão de UI explicitamente para o plan. O
padrão mais próximo já existente no projeto para "escolher uma cliente
vinculada e ver algo específico dela" não é `parceria/planos` (que é uma
lista agregada de envios de todas as clientes numa tela só, porque um envio de
plano é um evento pontual) — é `painel/membros/[membroId]` (lista de membros →
detalhe por membro), porque medidas são uma linha do tempo própria por
cliente, do mesmo jeito que sessões de pacote são. Reaproveitar esse padrão
dinâmico já testado no projeto é mais fiel ao Princípio II do que inventar um
seletor numa página só.

**Alternatives considered**: uma página única em `/parceria/medidas` com um
`<select>` de cliente e o histórico trocando por client-side state — rejeitada
por exigir um componente cliente novo só pra alternância, quando o projeto já
resolve "lista → detalhe" com rota dinâmica + Server Component em outro lugar
exatamente análogo.

## Decisão 6 — Onde mora a checagem de vínculo para leitura

**Decision**: `obterMedidasDaCliente(clienteId)`, em
`src/app/parceria/medidas/[clienteId]/queries.ts`, chama
`requererPapel(["PARCERIA"])` e depois busca o `VinculoParceria` por
`clienteId_parceriaId` (mesma chave composta que `enviarPlano` já usa em
`src/app/parceria/planos/actions.ts:33`), lançando `AppError` se não existir
ou `ativo: false` — antes de qualquer `prisma.registroMedida.findMany`.

**Rationale**: é o pedido explícito da spec/prompt: mesmo gate, mesma
checagem de vínculo, mesma chave composta já usada em `enviarPlano`. Colocar a
checagem numa função de query (não de action) segue o que `listarClientesVinculadas`/
`listarPlanosEnviados` já fazem hoje — funções assíncronas comuns, chamadas
direto de um Server Component, sem precisar de `"use server"` (só actions
disparadas do client precisam disso).

## Decisão 7 — Lista de clientes não duplica gate extra

**Decision**: `/parceria/medidas/page.tsx` não adiciona nenhum gate próprio
além do que `src/app/parceria/layout.tsx` já aplica
(`podeAcessarAreaParceria`) — mesmo comportamento que `/parceria/planos`
já tem hoje, porque a lista só devolve vínculos da própria sessão
(`parceriaId: session.user.id`), sem receber nenhum id de cliente por
parâmetro que precise ser validado.

**Rationale**: consistência com o padrão existente; a superfície que
realmente precisa do gate redundante (`requererPapel` + checagem de vínculo)
é a rota de detalhe, que recebe um `clienteId` de fora (via URL) e por isso
não pode confiar só no layout.

## Decisão 8 — `GraficoEvolucao` passa a cobrir os 12 campos novos, com agregação por média nos bilaterais

**Decision** (fechada — não mais um item aberto de review): `GraficoEvolucao`
passa a desenhar uma linha por medida de tronco/membro (5 + 7 = 12 linhas),
além da linha de `peso` já existente (inalterada). `altura` **não** entra no
gráfico — não foi pedida ali, e é uma medida que varia pouco/nada entre
registros de uma cliente adulta, diferente das demais (que são o objetivo do
gráfico de evolução).

Para cada uma das 7 medidas de membro, o ponto plotado por data é derivado
assim (função pura em `page.tsx`, onde `pontosGrafico` já é montado hoje a
partir de `medidas`):

```ts
function valorMembro(
  direito: number | null,
  esquerdo: number | null,
  legado: number | null = null,
): number | null {
  if (direito != null && esquerdo != null) return (direito + esquerdo) / 2;
  if (direito != null) return direito;
  if (esquerdo != null) return esquerdo;
  return legado;
}
```

- `braco` e `coxa` (as duas linhas que já existem hoje) passam a chamar
  `valorMembro(bracoDireito, bracoEsquerdo, braco)` e
  `valorMembro(coxaDireita, coxaEsquerda, coxa)` respectivamente — o terceiro
  argumento (`legado`) é o que mantém a linha contínua para registros
  anteriores a esta feature, que só têm o campo antigo preenchido.
- `antebraco`, `punho`, `joelho`, `panturrilha`, `tornozelo` são medidas
  totalmente novas (sem campo legado equivalente) — chamam `valorMembro` só
  com `direito`/`esquerdo` (terceiro argumento omitido, `null`), então
  registros anteriores a esta feature naturalmente não plotam nada nessas
  cinco linhas (nunca existiram).
- As 5 medidas de tronco (`ombro`, `peitoBusto`, `cintura`, `abdomen`,
  `quadril`) não passam por `valorMembro` — são valor único, plotadas
  diretamente como os campos já são hoje (`cintura`/`quadril`).

**Rationale**: é a decisão explícita — o gráfico mostra tendência agregada
por medida (útil para ver evolução geral de "braço", "coxa" etc. numa linha
só), e a assimetria exata entre lados continua disponível sem perda na tabela
de histórico (que já lista os valores brutos por campo, `bracoDireito`
separado de `bracoEsquerdo`). Usar o campo legado como fallback só quando
nenhum dos dois lados novos está preenchido é o que evita a "linha congelada"
identificada anteriormente nesta mesma Decisão, sem exigir nenhuma migração
de dado: um registro antigo (`braco` preenchido, `bracoDireito`/`bracoEsquerdo`
nulos) continua alimentando a linha "Braço" do gráfico exatamente como hoje.

**Alternatives considered**:
- Duas linhas por medida bilateral (direito e esquerdo separadas) no próprio
  gráfico — rejeitado pela decisão explícita: o gráfico é para tendência
  agregada, a assimetria fica só na tabela, e dobraria 7 linhas para 14
  (mais as 5 de tronco = 19 no total), tornando o `LineChart` iléguível.
- Preferir sempre o lado direito quando os dois existem, ignorando o
  esquerdo — rejeitado por descartar informação real sem necessidade; a
  média usa os dois valores quando ambos existem, só cai para "o lado que
  existe" quando falta um.
