import Link from "next/link";
import { Heart, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { auth } from "@/auth";
import { temAlgumPapel } from "@/lib/auth/pode-acessar-painel";
import { listarPosts, obterTeaserDesafioAtivo } from "./queries";
import {
  apagarPost,
  alternarCurtida,
  comentar,
  apagarComentario,
} from "./actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
    <main className="mx-auto w-full max-w-lg px-4 py-6">
      <h1 className="font-heading text-2xl text-foreground">Feed</h1>

      {desafioAtivo && (
        <Link href="/cliente/desafios" className="mt-4 block">
          <Card className="border-primary/30 bg-secondary/60 transition-colors hover:bg-secondary">
            <CardContent className="flex items-center justify-between gap-3">
              <div>
                <Badge className="mb-1 bg-primary text-primary-foreground">
                  Desafio ativo
                </Badge>
                <p className="font-heading text-base text-foreground">
                  {desafioAtivo.titulo}
                </p>
                <p className="text-xs text-muted-foreground">
                  até {desafioAtivo.dataFim.toLocaleDateString("pt-BR")}
                </p>
              </div>
              <span className="text-sm font-medium text-accent-foreground">
                Ver desafio →
              </span>
            </CardContent>
          </Card>
        </Link>
      )}

      {posts.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">Nenhum post ainda.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {posts.map((post) => {
            const podeEditar = session.user.id === post.autorId;
            const podeApagarPost = podeEditar || podeModerar;

            return (
              <li key={post.id}>
                <Card>
                  <CardHeader className="flex-row items-center justify-between space-y-0">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {post.autor.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {post.criadoEm.toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    {(podeEditar || podeApagarPost) && (
                      <div className="flex items-center gap-1">
                        {podeEditar && (
                          <Link
                            href={`/feed/${post.id}/editar`}
                            className={buttonVariants({
                              variant: "ghost",
                              size: "sm",
                            })}
                          >
                            <Pencil className="size-3.5" />
                            Editar
                          </Link>
                        )}
                        {podeApagarPost && (
                          <form action={apagarPost}>
                            <input type="hidden" name="postId" value={post.id} />
                            <Button
                              type="submit"
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Apagar post"
                            >
                              <Trash2 />
                            </Button>
                          </form>
                        )}
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="flex flex-col gap-3">
                    {post.urlImagem && (
                      <img
                        src={post.urlImagem}
                        alt="Imagem do post"
                        className="w-full rounded-lg object-cover"
                      />
                    )}
                    {post.texto && (
                      <p className="text-sm text-foreground">{post.texto}</p>
                    )}

                    <form action={alternarCurtida}>
                      <input type="hidden" name="postId" value={post.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className={
                          post.curtidoPeloUsuario
                            ? "text-primary hover:text-primary"
                            : "text-muted-foreground"
                        }
                      >
                        <Heart
                          className={post.curtidoPeloUsuario ? "fill-primary" : ""}
                        />
                        {post.curtidoPeloUsuario ? "Descurtir" : "Curtir"} (
                        {post.totalCurtidas})
                      </Button>
                    </form>
                  </CardContent>

                  <CardFooter className="flex flex-col items-stretch gap-3">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <MessageCircle className="size-3.5" />
                      Comentários
                    </div>

                    {post.comentarios.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Nenhum comentário ainda.
                      </p>
                    ) : (
                      <ul className="flex flex-col gap-2">
                        {post.comentarios.map((comentario) => {
                          const podeApagarComentario =
                            session.user.id === comentario.autorId || podeModerar;
                          return (
                            <li
                              key={comentario.id}
                              className="flex items-start justify-between gap-2 rounded-lg bg-muted px-3 py-2"
                            >
                              <p className="text-xs text-foreground">
                                <span className="font-semibold">
                                  {comentario.autor.name}
                                </span>{" "}
                                {comentario.texto}
                              </p>
                              {podeApagarComentario && (
                                <form action={apagarComentario}>
                                  <input
                                    type="hidden"
                                    name="comentarioId"
                                    value={comentario.id}
                                  />
                                  <Button type="submit" variant="ghost" size="icon-xs">
                                    <Trash2 />
                                    <span className="sr-only">Apagar</span>
                                  </Button>
                                </form>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    <form action={comentar} className="flex items-center gap-2">
                      <input type="hidden" name="postId" value={post.id} />
                      <Input
                        type="text"
                        name="texto"
                        placeholder="Comentar"
                        aria-label="Comentar"
                        className="flex-1"
                      />
                      <Button type="submit" size="sm">
                        Enviar
                      </Button>
                    </form>
                  </CardFooter>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {proximoCursor && (
        <Link
          href={`/feed?cursor=${proximoCursor}`}
          className="mt-6 block text-center text-sm font-medium text-primary hover:underline"
        >
          Carregar mais
        </Link>
      )}
    </main>
  );
}
