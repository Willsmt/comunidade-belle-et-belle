import Link from "next/link";
import Image from "next/image";
import { Pencil, Plus, MessageCircle } from "lucide-react";
import { auth } from "@/auth";
import { temAlgumPapel } from "@/lib/auth/pode-acessar-painel";
import { listarPosts, obterTeaserDesafioAtivo } from "./queries";
import { BotaoApagarPost } from "./botao-apagar-post";
import { BotaoCurtir } from "./botao-curtir";
import { FormularioComentario } from "./formulario-comentario";
import { BotaoApagarComentario } from "./botao-apagar-comentario";
import { AvatarPessoa } from "@/components/avatar-pessoa";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
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
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl text-foreground">Feed</h1>
        <Link
          href="/feed/novo"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <Plus className="size-3.5" />
          Novo post
        </Link>
      </div>

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
                        <Link href={`/perfil/${post.autorId}`} className="hover:underline">
                          {post.autor.name}
                        </Link>
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
                        {podeApagarPost && <BotaoApagarPost postId={post.id} />}
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="flex flex-col gap-3">
                    {post.urlImagem && (
                      <Image
                        src={post.urlImagem}
                        alt="Imagem do post"
                        width={1600}
                        height={1600}
                        sizes="(min-width: 512px) 512px, 100vw"
                        style={{ width: "100%", height: "auto" }}
                        className="rounded-lg object-cover"
                      />
                    )}
                    {post.texto && (
                      <p className="text-sm text-foreground">{post.texto}</p>
                    )}

                    <BotaoCurtir
                      postId={post.id}
                      curtidoPeloUsuario={post.curtidoPeloUsuario}
                      totalCurtidas={post.totalCurtidas}
                    />
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
                              <div className="flex items-start gap-2">
                                <AvatarPessoa
                                  nome={comentario.autor.name}
                                  fotoUrl={comentario.autor.fotoUrl}
                                />
                                <p className="text-xs text-foreground">
                                  <Link
                                    href={`/perfil/${comentario.autorId}`}
                                    className="font-semibold hover:underline"
                                  >
                                    {comentario.autor.name}
                                  </Link>{" "}
                                  {comentario.texto}
                                </p>
                              </div>
                              {podeApagarComentario && (
                                <BotaoApagarComentario comentarioId={comentario.id} />
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    <FormularioComentario postId={post.id} />
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
