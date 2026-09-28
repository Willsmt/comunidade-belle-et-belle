# Feature: Parcerias

## Visão geral (sem jargão)

Uma "parceria" é um profissional externo à administração — uma nutricionista, um personal trainer — que atende clientes da comunidade fora da plataforma, mas usa o app para duas coisas: enviar planos personalizados (treino ou dieta, em PDF) e acompanhar as medidas de quem ela atende (ver [`docs/features/medidas.md`](./medidas.md)). Só a administração (gestora/admin) pode criar essa ponte entre uma cliente e uma parceria — é o que chamamos de **vínculo**. Sem vínculo ativo, a parceria não enxerga nada daquela cliente.

## Estrutura de arquivos

| Arquivo | Papel |
| --- | --- |
| `src/app/parceria/perfil/page.tsx`, `actions.ts`, `queries.ts`, `formulario-perfil-parceria.tsx` | Parceria edita o próprio `PerfilParceria` (especialidade, bio, foto) |
| `src/app/parceria/planos/page.tsx`, `actions.ts`, `queries.ts`, `formulario-envio.tsx` | Parceria envia um `PlanoRecebido` (PDF) a uma cliente vinculada |
| `src/app/painel/vinculos/page.tsx`, `actions.ts`, `queries.ts`, `formulario-criar-vinculo.tsx`, `botao-reativar-vinculo.tsx` | Gestora cria/desativa/reativa `VinculoParceria` |
| `src/app/cliente/parcerias/page.tsx`, `queries.ts` | Cliente vê as parcerias vinculadas a ela |
| `src/app/cliente/planos/page.tsx`, `queries.ts` | Cliente vê/baixa os planos recebidos |
| `src/lib/storage/parcerias.ts` | Upload/validação da foto de perfil da parceria (JPEG/PNG/WebP, 5MB) |
| `src/lib/storage/planos.ts` | Upload/validação do PDF do plano (10MB) |

## Models envolvidos

Ver [`docs/database.md`](../database.md#parcerias--ver-docsfeaturesparceriasmd).

- **`VinculoParceria`** — liga um `User` cliente a um `User` parceria; `ativo` controla se a ligação está em vigor; `@@unique([clienteId, parceriaId])` garante um único vínculo por par (reativar reusa o mesmo registro, nunca duplica).
- **`PlanoRecebido`** — um envio de arquivo (TREINO ou DIETA) de uma parceria para uma cliente. Sem edição, só novos envios.
- **`PerfilParceria`** — perfil próprio da parceria (especialidade, bio, foto), separado do `Perfil` de cliente.

## Rotas e Server Actions

| Action | O que faz | Gate | Models |
| --- | --- | --- | --- |
| `atualizarPerfilParceria` | Upsert de `PerfilParceria`; troca de foto sobe a nova antes de apagar a antiga | `requererPapel(["PARCERIA"])` | `PerfilParceria` |
| `enviarPlano` | Valida cliente + tipo + arquivo, confere vínculo ativo, sobe o PDF, cria `PlanoRecebido` | `requererPapel(["PARCERIA"])` | `VinculoParceria`, `PlanoRecebido` |
| `criarVinculo` | Cria o vínculo, ou reativa se já existir (mesmo par) | `requererAcessoPainel()` (GESTORA/ADMIN) | `VinculoParceria` |
| `desativarVinculo` | `ativo: false` | `requererAcessoPainel()` | `VinculoParceria` |
| `reativarVinculo` | `ativo: true` | `requererAcessoPainel()` | `VinculoParceria` |

## Fluxo: criar e reativar vínculo

`criarVinculo` faz um `upsert` na chave composta `clienteId_parceriaId`: se o vínculo já existir (mesmo desativado), ele é reativado em vez de duplicado; se não existir, é criado com `ativo: true` e `criadoPorId` apontando para a gestora que criou. **Nunca há exclusão real de um vínculo** — desativar/reativar são sempre a mesma flag `ativo` sendo ligada/desligada, o que preserva o histórico de tudo que dependeu daquele vínculo (planos enviados no passado continuam existindo e visíveis à cliente mesmo depois de desativado).

```mermaid
stateDiagram-v2
    [*] --> SemVinculo
    SemVinculo --> Ativo: criarVinculo (primeira vez)
    Ativo --> Inativo: desativarVinculo
    Inativo --> Ativo: reativarVinculo (mesmo registro)
    Ativo --> Ativo: criarVinculo (par já existe → upsert reativa, no-op se já ativo)
```

## Fluxo: envio de plano

```mermaid
sequenceDiagram
    participant Pa as Parceria
    participant F as formulario-envio.tsx
    participant A as enviarPlano (action)
    participant R2 as Cloudflare R2
    participant DB as Banco

    Pa->>F: escolhe cliente (só as vinculadas), tipo (TREINO/DIETA), anexa PDF
    F->>A: envia FormData
    A->>DB: confere VinculoParceria.ativo = true (dupla proteção contra IDOR, mesmo com UI já filtrando)
    A->>R2: valida PDF (tipo + até 10MB) e sobe o arquivo
    A->>DB: cria PlanoRecebido
    Note over Pa,DB: cliente vê em /cliente/planos, baixa via URL assinada do R2 (expira em 300s)
```

O limite de 10MB (`TAMANHO_MAXIMO_BYTES` em `src/lib/storage/planos.ts`) é o mesmo valor referenciado no comentário de `next.config.ts` sobre `bodySizeLimit: "12mb"` das Server Actions — a folga de 2MB cobre o overhead do multipart/form-data (boundaries e headers) em cima do arquivo em si.

## Perfil da parceria (`PerfilParceria`)

Campos editáveis (todos opcionais): `especialidade`, `bio`, `fotoChave`. Diferente do perfil de cliente, **não existe uma página pública equivalente a `/perfil/[clienteId]`** para parcerias — a única forma de uma cliente ver o `PerfilParceria` de alguém é através da relação de vínculo ativo, em `/cliente/parcerias`. Isso torna a exposição do perfil da parceria mais restrita, por natureza, que a do perfil de cliente.

## Pegadinhas e dívidas técnicas

- **Arquivo de foto pode ficar órfão no R2**: em `atualizarPerfilParceria`, se o upload da nova foto falhar antes do `upsert` do `PerfilParceria` chegar a rodar, o arquivo novo já pode ter sido gravado no R2 sem nunca ser referenciado por nenhum registro — não há limpeza automática desse órfão.
- Todos os `queries.ts` deste contexto (`parceria/perfil`, `parceria/planos`, `cliente/parcerias`, `cliente/planos`) lançam `new Error("Sessão inválida")` **cru** (não `AppError`) — mesmo padrão inconsistente já visto em [`docs/features/medidas.md`](./medidas.md#pegadinhas-e-dívidas-técnicas). Inofensivo hoje porque o middleware bloqueia sessões ausentes antes, mas destoa do padrão do resto do projeto.
- Não existe uma spec de spec-kit dedicada a "parcerias" isoladamente — o vínculo aparece documentado dentro de `specs/003-medidas-parcerias/data-model.md` como pré-condição reaproveitada, não como escopo próprio da feature.
