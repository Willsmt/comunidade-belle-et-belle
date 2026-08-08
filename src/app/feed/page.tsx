import Link from "next/link";
import { auth } from "@/auth";
import { temAlgumPapel } from "@/lib/auth/pode-acessar-painel";
import { listarPosts } from "./queries";
import { apagarPost } from "./actions";

export default async function FeedPage() {
  const session = await auth();
  const podeModerar = session?.user
    ? temAlgumPapel(session.user.papeis, ["GESTORA", "ADMIN"])
    : false;

  const posts = await listarPosts();

  return (
    <section>
      <h1>Feed</h1>

      {posts.length === 0 ? (
        <p>Nenhum post ainda.</p>
      ) : (
        <ul>
          {posts.map((post) => {
            const podeEditar = session?.user?.id === post.autorId;
            const podeApagar = podeEditar || podeModerar;

            return (
              <li key={post.id}>
                <p>{post.autor.name}</p>
                {post.urlImagem && (
                  <img src={post.urlImagem} alt="Imagem do post" width={300} />
                )}
                {post.texto && <p>{post.texto}</p>}
                <p>{post.criadoEm.toLocaleDateString("pt-BR")}</p>

                {podeEditar && (
                  <Link href={`/feed/${post.id}/editar`}>Editar</Link>
                )}

                {podeApagar && (
                  <form action={apagarPost}>
                    <input type="hidden" name="postId" value={post.id} />
                    <button type="submit">Apagar</button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
