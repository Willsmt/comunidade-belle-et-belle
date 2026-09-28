import Link from "next/link";
import Image from "next/image";
import { Pencil, MessageCircle } from "lucide-react";
import type { listarPosts } from "./queries";
import { BotaoApagarPost } from "./botao-apagar-post";
import { BotaoAlternarDestaque } from "./botao-alternar-destaque";
import { BotaoCurtir } from "./botao-curtir";
import { FormularioComentario } from "./formulario-comentario";
import { BotaoApagarComentario } from "./botao-apagar-comentario";
import { AvatarPessoa } from "@/components/avatar-pessoa";
import { FotoComZoom } from "@/components/foto-com-zoom";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type PostParaExibicao = Awaited<ReturnType<typeof listarPosts>>["posts"][number];

export function CartaoPost({
  post,
  usuarioId,
  podeModerar,
}: {
  post: PostParaExibicao;
  usuarioId: string;
  podeModerar: boolean;
}) {
  const podeEditar = usuarioId === post.autorId;
  const podeApagarPost = podeEditar || podeModerar;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          {post.destaque && (
            <Badge className="mb-1 bg-primary text-primary-foreground">
              Destaque
            </Badge>
          )}
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
            {podeModerar && (
              <BotaoAlternarDestaque postId={post.id} destaque={post.destaque} />
            )}
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
          <FotoComZoom src={post.urlImagem} alt="Imagem do post">
            <Image
              src={post.urlImagem}
              alt="Imagem do post"
              width={1600}
              height={1600}
              sizes="(min-width: 512px) 512px, 100vw"
              style={{ width: "100%", height: "auto" }}
              className="rounded-lg object-cover"
            />
          </FotoComZoom>
        )}
        {post.texto && <p className="text-sm text-foreground">{post.texto}</p>}

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
          <p className="text-xs text-muted-foreground">Nenhum comentário ainda.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {post.comentarios.map((comentario) => {
              const podeApagarComentario =
                usuarioId === comentario.autorId || podeModerar;
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
  );
}
