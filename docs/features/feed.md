# Feature: Feed

## Visão geral (sem jargão)

É o mural da comunidade: qualquer cliente, parceria, gestora ou admin pode publicar um texto e/ou uma foto, curtir e comentar publicações de outras pessoas. É a feature mais "rede social" do produto.

Uma novidade recente é o **post fixado**: a administração pode escolher um post para ficar sempre no topo do feed, destacado, independente de quando foi publicado — pense em um mural físico onde alguém pode fixar um aviso importante com uma tachinha, na frente de tudo.

## Estrutura de arquivos

| Arquivo | Papel |
| --- | --- |
| `src/app/feed/page.tsx` | Lista de posts paginada por cursor + post fixado + teaser do desafio ativo |
| `src/app/feed/actions.ts` | `criarPost`, `alternarDestaque`, `editarPost`, `apagarPost`, `alternarCurtida`, `comentar`, `apagarComentario` |
| `src/app/feed/queries.ts` | `listarPosts`, `obterPostDestaque`, `obterPost`, `listarFotosEvolucaoDoUsuario`, `obterTeaserDesafioAtivo` |
| `src/app/feed/cartao-post.tsx` | Exibição de um post: imagem com zoom, curtir, comentários, ações de dono/moderação |
| `src/app/feed/botao-alternar-destaque.tsx` | Botão de fixar/desafixar (só moderação) |
| `src/app/feed/botao-apagar-post.tsx` / `botao-apagar-comentario.tsx` | Excluir com confirmação |
| `src/app/feed/botao-curtir.tsx` | Toggle de curtida |
| `src/app/feed/formulario-comentario.tsx` | Novo comentário |
| `src/app/feed/novo/page.tsx` + `formulario-novo-post.tsx` | Criar post: texto, upload de imagem OU escolha de uma foto de evolução já enviada, checkbox de destaque (só moderação) |
| `src/app/feed/[postId]/editar/page.tsx` + `formulario-editar-post.tsx` | Editar post: só o autor, pode trocar texto e/ou imagem |
| `src/lib/storage/posts.ts` | Upload/validação/compressão/delete da imagem do post no R2 |

## Models envolvidos

Ver [`docs/database.md`](../database.md#feed--ver-docsfeaturesfeedmd).

- **`Post`** — `autorId`, `texto`, `imagemChave`, `fotoEvolucaoId` (opcional, aponta pra uma `FotoEvolucao` já existente), `destaque`.
- **`Like`** — único por `postId`+`usuarioId` (é um toggle, não um contador).
- **`Comentario`** — sem edição, só criação e exclusão.

## Rotas e Server Actions

| Action | O que faz | Gate | Models |
| --- | --- | --- | --- |
| `criarPost` | Cria post (texto e/ou imagem); se marcar destaque, exige moderação | `requererSessao()`; `destaque=true` exige adicionalmente `requererAcessoPainel()` | `Post` |
| `alternarDestaque(postId)` | Fixa/desafixa um post existente | `requererAcessoPainel()` (GESTORA/ADMIN) | `Post` |
| `editarPost` | Troca texto e/ou imagem | `requererSessao()` + **só o autor** (moderador não pode editar conteúdo alheio) | `Post` |
| `apagarPost` | Exclui post | `requererSessao()` + autor **ou** GESTORA/ADMIN | `Post` |
| `alternarCurtida` | Curte/descurte | `requererSessao()` | `Like` |
| `comentar` | Adiciona comentário | `requererSessao()` | `Comentario` |
| `apagarComentario` | Exclui comentário | `requererSessao()` + autor do comentário **ou** GESTORA/ADMIN | `Comentario` |

Moderação pode **apagar** post/comentário de qualquer pessoa, mas nunca **editar** conteúdo alheio — só quem escreveu edita o próprio texto/imagem.

## Fluxo: criar post (imagem nova vs. foto de evolução)

O formulário de novo post oferece duas fontes de imagem, mutuamente exclusivas:

1. Upload de um arquivo novo (`input type="file"`).
2. Escolher, por um rádio, uma foto já enviada em "Minhas fotos" (`FotoEvolucao` do próprio usuário).

```mermaid
flowchart TD
    A[Usuário preenche texto e/ou imagem] --> B{Enviou arquivo novo?}
    B -- Sim --> C[uploadImagemPost: valida, comprime pra WebP, sobe ao R2]
    B -- Não --> D{Escolheu fotoEvolucaoId?}
    D -- Sim --> E[Confere que a foto pertence ao usuário]
    D -- Não --> F{Tem texto?}
    C --> G[Cria Post com imagemChave nova]
    E --> H[Cria Post reaproveitando a chave existente + fotoEvolucaoId]
    F -- Não --> I[AppError: post precisa de texto ou imagem]
    F -- Sim --> J[Cria Post só com texto]
```

Curtir e comentar são Server Actions puras com `revalidatePath("/feed")` — não há atualização otimista no client; a UI reflete o novo estado só depois do round-trip completo (o botão fica desabilitado via `isPending` do `useAcaoComErro` enquanto isso).

## Fluxo: post em destaque ("um ativo por vez")

Só GESTORA/ADMIN pode fixar um post — tanto pelo checkbox ao criar quanto pelo botão de alternar em qualquer post já publicado.

```mermaid
sequenceDiagram
    participant M as Moderação
    participant A as alternarDestaque / criarPost
    participant DB as Banco

    M->>A: marca "post X" como destaque
    A->>DB: transação: updateMany(Post, destaque=true → destaque=false)
    A->>DB: transação: update/create do post X com destaque=true
    Note over DB: nunca existem 2 posts com destaque=true ao mesmo tempo
```

A mutualidade é garantida por `prisma.$transaction([...])` — o mesmo padrão usado em `Desafio.ativo` e `CicloPacote.ativo` (ver [`docs/architecture.md`](../architecture.md#padrão-um-ativo-por-vez)). Desfixar (post já em destaque) não precisa de transação — é um único `update`, sem concorrência com outro registro. Ao excluir o post que estava em destaque, nenhum outro é promovido automaticamente: o feed simplesmente fica sem post fixado até alguém escolher um novo (comportamento intencional, documentado em `specs/004-post-destaque-feed/spec.md`).

Na listagem, `listarPosts` filtra explicitamente `destaque: false` para não duplicar o post fixado na lista cronológica — ele aparece só uma vez, sempre no topo, renderizado antes da lista normal em `page.tsx`.

## Zoom em fotos

O zoom (commit "adiciona zoom em fotos no feed, perfil, desafios e aprovações") é um componente compartilhado, `FotoComZoom`, usado como wrapper em volta da imagem do post em `cartao-post.tsx` — não é uma implementação duplicada por página, é reaproveitado nas outras telas citadas no commit.

## Pegadinhas e dívidas técnicas

- **Paginação é por cursor, não infinite scroll**: `listarPosts` usa `cursor`/`skip: 1`/`take: 11`, e a UI oferece um link "Carregar mais" que recarrega a página com `?cursor=` — não há scroll infinito nem fetch incremental no client.
- **Editar post pode trocar a imagem**, não só o texto. Se a imagem antiga era um upload próprio do post (`imagemChave` sem `fotoEvolucaoId`), o arquivo antigo é apagado do R2 ao trocar. Se a imagem antiga era uma `FotoEvolucao` reaproveitada, ela **não** é apagada (correto — pertence à galeria pessoal, não ao post). A edição não permite trocar por uma foto de evolução da galeria — só por upload de arquivo novo ou manter a atual.
- **`obterPostAutorizado` tem nome enganoso**: confirma só que a pessoa pode "acessar" o post (autor ou moderador) para fins de exclusão; `editarPost` precisa reforçar manualmente, depois, que só o autor pode editar. Quem reusar essa função deve tratar a permissão de edição separadamente.
