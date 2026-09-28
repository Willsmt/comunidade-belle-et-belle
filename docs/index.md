# Documentação — Comunidade Belle et Belle

Este é o índice de toda a documentação do projeto. Se você é novo(a) no time, leia nesta ordem:

1. [`CLAUDE.md`](../CLAUDE.md) (raiz do repo) — visão geral, stack, comandos, variáveis de ambiente, padrões-chave.
2. [`architecture.md`](architecture.md) — como as peças se encaixam: autenticação, gates de acesso, integrações externas, configuração por ambiente.
3. [`database.md`](database.md) — modelo de dados completo (diagrama ER + tabelas).
4. Os documentos de feature abaixo, na ordem que fizer sentido pro que você for mexer.

## Documentos gerais

| Documento | Conteúdo |
| --- | --- |
| [`architecture.md`](architecture.md) | Fluxo de autenticação, gates de acesso (middleware + layouts + Server Actions), integrações externas (Google OAuth, Cloudflare R2), configuração por ambiente, infraestrutura |
| [`database.md`](database.md) | Diagrama ER (Mermaid), todas as tabelas/campos/relacionamentos, pegadinhas de modelagem |

## Documentos por feature

| Feature | Documento | Bounded context (pastas principais) |
| --- | --- | --- |
| Identidade & acesso | [`features/identidade-acesso.md`](features/identidade-acesso.md) | `login/`, `bem-vinda/`, `aguardando-aprovacao/`, `conta-suspensa/`, `api/auth/`, `src/auth.ts`, `src/lib/auth/`, `painel/membros/` (gestão de papéis) |
| Desafios | [`features/desafios.md`](features/desafios.md) | `cliente/desafios/`, `painel/desafios/`, `painel/aprovacoes/`, `src/lib/desafios/`, `src/lib/emblemas/` |
| Pacotes | [`features/pacotes.md`](features/pacotes.md) | `painel/pacotes/`, `painel/membros/[membroId]/` |
| Medidas | [`features/medidas.md`](features/medidas.md) | `cliente/medidas/`, `parceria/medidas/` |
| Parcerias | [`features/parcerias.md`](features/parcerias.md) | `parceria/perfil/`, `parceria/planos/`, `cliente/planos/`, `cliente/parcerias/`, `painel/vinculos/` |
| Feed | [`features/feed.md`](features/feed.md) | `feed/` |
| Perfil | [`features/perfil.md`](features/perfil.md) | `perfil/[clienteId]/`, `cliente/perfil/`, `cliente/fotos/` |

Todo documento de feature segue a mesma estrutura: visão geral em linguagem simples → responsabilidades → arquivos → models envolvidos (com link para `database.md`) → rotas/actions com gate de acesso → fluxos principais (com diagrama) → integração com outras features → pegadinhas e dívidas técnicas.
