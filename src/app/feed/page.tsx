import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/auth";
import { temAlgumPapel } from "@/lib/auth/pode-acessar-painel";
import { listarPosts, obterPostDestaque, obterTeaserDesafioAtivo } from "./queries";
import { CartaoPost } from "./cartao-post";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  const [{ posts, proximoCursor }, postDestaque, desafioAtivo] = await Promise.all([
    listarPosts(session.user.id, cursor),
    obterPostDestaque(session.user.id),
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

      {postDestaque && (
        <div className="mt-6">
          <CartaoPost
            post={postDestaque}
            usuarioId={session.user.id}
            podeModerar={podeModerar}
          />
        </div>
      )}

      {posts.length === 0 ? (
        !postDestaque && (
          <p className="mt-6 text-sm text-muted-foreground">Nenhum post ainda.</p>
        )
      ) : (
        <ul className={postDestaque ? "mt-4 flex flex-col gap-4" : "mt-6 flex flex-col gap-4"}>
          {posts.map((post) => (
            <li key={post.id}>
              <CartaoPost
                post={post}
                usuarioId={session.user.id}
                podeModerar={podeModerar}
              />
            </li>
          ))}
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
