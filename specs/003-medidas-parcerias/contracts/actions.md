# Contracts: Server Actions & Queries — Protocolo Completo de Medidas com Leitura por Parceria

Aplicação Next.js (App Router) sem API pública separada — a interface real é
Server Actions + funções de query, no mesmo estilo já usado em
`src/app/cliente/medidas/` e `src/app/parceria/planos/`. Toda action roda
dentro de `executarAction` e checa o gate de acesso apropriado antes de tocar
o banco.

## `src/app/cliente/medidas/actions.ts` (existente) — alterada

### `criarRegistroMedida(formData: FormData): Promise<void>` — alterada
- **Gate**: `requererPapel(["CLIENTE"])` — inalterado.
- **Input novo**: além dos campos já existentes (`peso`, `cintura`, `quadril`,
  `braco`, `coxa` — estes dois últimos **saem** da lista de campos aceitos por
  este formulário, research.md Decisão 4), passa a aceitar `altura`, os cinco
  campos de tronco (`ombro`, `peitoBusto`, `cintura`, `abdomen`, `quadril`) e
  os quatorze campos bilaterais de membro (`bracoDireito`/`bracoEsquerdo`,
  `antebracoDireito`/`antebracoEsquerdo`, `punhoDireito`/`punhoEsquerdo`,
  `coxaDireita`/`coxaEsquerda`, `joelhoDireito`/`joelhoEsquerdo`,
  `panturrilhaDireita`/`panturrilhaEsquerda`,
  `tornozeloDireito`/`tornozeloEsquerdo`).
- `CAMPOS_MEDIDA` passa a listar os 20 campos novos (sem `braco`/`coxa`); a
  validação "ao menos uma medida preenchida" (FR-004) continua igual, só
  sobre a lista maior.
- **Erros**: mesmo `AppError("Preencha ao menos uma medida")` de hoje, sem
  mudança de mensagem.
- **Efeito**: `prisma.registroMedida.create` com os campos informados,
  associados a `session.user.id` e à data.
- **Revalida**: `/cliente/medidas` — inalterado.

### `listarMedidas()` (em `queries.ts`, existente) — sem mudança de código
- `prisma.registroMedida.findMany({ where: { clienteId }, orderBy: { data: "desc" } })`
  já devolve todas as colunas do modelo por padrão (sem `select`) — os campos
  novos aparecem automaticamente, sem precisar tocar este arquivo.

## `src/app/parceria/medidas/queries.ts` (novo)

### `listarClientesVinculadas()` — reexportada, sem duplicar lógica
- Reaproveita literalmente a função já existente em
  `src/app/parceria/planos/queries.ts` (`import { listarClientesVinculadas }
  from "../planos/queries"`) como ponto de entrada da lista — mesmo pedido
  explícito da spec. Nenhuma nova implementação.

## `src/app/parceria/medidas/[clienteId]/queries.ts` (novo)

### `obterMedidasDaCliente(clienteId: string): Promise<{ cliente: { id: string; name: string | null; email: string }; medidas: RegistroMedida[] }>`
- **Gate**: `requererPapel(["PARCERIA"])`.
- **Erros**: `AppError("Cliente não vinculada a você")` se não existir
  `VinculoParceria` para `{ clienteId, parceriaId: session.user.id }` ou se
  `ativo: false` — mesma checagem e mesma mensagem que `enviarPlano` já usa em
  `src/app/parceria/planos/actions.ts:33-40` (research.md Decisão 6).
- **Efeito**: sem escrita nenhuma. Busca o `User` (`id`, `name`, `email`) para
  exibir o nome da cliente na tela, e
  `prisma.registroMedida.findMany({ where: { clienteId }, orderBy: { data: "desc" } })`
  — mesma ordenação já usada em `listarMedidas()` do lado da cliente.
- **Somente leitura**: este arquivo não expõe nenhuma action de
  criar/editar/excluir `RegistroMedida` (FR-013). Não existe formulário nesta
  rota.

## `src/app/parceria/layout.tsx` (existente) — alterado

- Novo item em `links` do `SubNav`: `{ href: "/parceria/medidas", label:
  "Medidas das clientes" }`, ao lado de "Meus planos" e "Meu perfil" —
  nenhuma outra mudança no layout.
