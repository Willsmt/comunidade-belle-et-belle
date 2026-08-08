import Link from "next/link";
import { auth } from "@/auth";
import { temAlgumPapel } from "@/lib/auth/pode-acessar-painel";
import { listarPosts, obterTeaserDesafioAtivo } from "./queries";
import {
  apagarPost,
  alternarCurtida,
  comentar,
  apagarComentario,
} from "./actions";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const { cursor } = await searchParams;
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const podeModerar = temAlgumPapel(session.user.papeis, ["GESTORA", "ADMIN"]);
  const [{ posts, proximoCursor }, desafioAtivo] = await Promise.all([
    listarPosts(session.user.id, cursor),
    obterTeaserDesafioAtivo(),
  ]);

  return (
    <section>
      <h1>Feed</h1>

      {desafioAtivo && (
        <p>
          Desafio ativo: <strong>{desafioAtivo.titulo}</strong> (até{" "}
          {desafioAtivo.dataFim.toLocaleDateString("pt-BR")}) —{" "}
          <Link href="/cliente/desafios">ver desafio</Link>
        </p>
      )}

      {posts.length === 0 ? (
        <p>Nenhum post ainda.</p>
      ) : (
        <ul>
          {posts.map((post) => {
            const podeEditar = session.user.id === post.autorId;
            const podeApagarPost = podeEditar || podeModerar;

            return (
              <li key={post.id}>
                <p>{post.autor.name}</p>
                {post.urlImagem && (
                  <img src={post.urlImagem} alt="Imagem do post" width={300} />
                )}
                {post.texto && <p>{post.texto}</p>}
                <p>{post.criadoEm.toLocaleDateString("pt-BR")}</p>

                <form action={alternarCurtida}>
                  <input type="hidden" name="postId" value={post.id} />
                  <button type="submit">
                    {post.curtidoPeloUsuario ? "Descurtir" : "Curtir"} (
                    {post.totalCurtidas})
                  </button>
                </form>

                {podeEditar && (
                  <Link href={`/feed/${post.id}/editar`}>Editar</Link>
                )}

                {podeApagarPost && (
                  <form action={apagarPost}>
                    <input type="hidden" name="postId" value={post.id} />
                    <button type="submit">Apagar post</button>
                  </form>
                )}

                <h2>Comentários</h2>
                {post.comentarios.length === 0 ? (
                  <p>Nenhum comentário ainda.</p>
                ) : (
                  <ul>
                    {post.comentarios.map((comentario) => {
                      const podeApagarComentario =
                        session.user.id === comentario.autorId || podeModerar;
                      return (
                        <li key={comentario.id}>
                          <p>{comentario.autor.name}</p>
                          <p>{comentario.texto}</p>
                          {podeApagarComentario && (
                            <form action={apagarComentario}>
                              <input
                                type="hidden"
                                name="comentarioId"
                                value={comentario.id}
                              />
                              <button type="submit">Apagar</button>
                            </form>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

                <form action={comentar}>
                  <input type="hidden" name="postId" value={post.id} />
                  <label>
                    Comentar
                    <input type="text" name="texto" />
                  </label>
                  <button type="submit">Enviar</button>
                </form>
              </li>
            );
          })}
        </ul>
      )}

      {proximoCursor && (
        <Link href={`/feed?cursor=${proximoCursor}`}>Carregar mais</Link>
      )}
    </section>
  );
}
