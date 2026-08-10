import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { auth } from "@/auth";
import { obterPerfilPublico } from "./queries";
import { obterIniciais } from "@/lib/iniciais";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function PerfilPublicoPage({
  params,
}: {
  params: Promise<{ clienteId: string }>;
}) {
  const { clienteId } = await params;
  const [perfil, session] = await Promise.all([
    obterPerfilPublico(clienteId),
    auth(),
  ]);

  if (!perfil) {
    notFound();
  }

  const souEuMesma = session?.user?.id === clienteId;

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {perfil.fotoUrl ? (
            <img
              src={perfil.fotoUrl}
              alt={`Foto de perfil de ${perfil.nome}`}
              width={64}
              height={64}
              className="size-16 rounded-full object-cover"
            />
          ) : (
            <div
              className="flex size-16 items-center justify-center rounded-full bg-secondary text-lg font-medium text-secondary-foreground"
              aria-hidden="true"
            >
              {obterIniciais(perfil.nome)}
            </div>
          )}
          <h1 className="font-heading text-2xl text-foreground">{perfil.nome}</h1>
        </div>
        {souEuMesma && (
          <Link
            href="/cliente/perfil"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Pencil className="size-3.5" />
            Editar perfil
          </Link>
        )}
      </div>
      {perfil.bio && <p className="mt-1 text-sm text-muted-foreground">{perfil.bio}</p>}

      <Card className="mt-4" aria-label="Emblemas">
        <CardHeader>
          <CardTitle>Emblemas</CardTitle>
        </CardHeader>
        <CardContent>
          {perfil.emblemasPublicos ? (
            perfil.conquistas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum emblema ainda</p>
            ) : (
              <ul className="flex flex-wrap gap-3">
                {perfil.conquistas.map((conquista) => (
                  <li key={conquista.id} className="flex flex-col items-start gap-1">
                    <Badge variant="secondary" className="gap-1">
                      {conquista.icone && <span>{conquista.icone}</span>}
                      <span>{conquista.nome}</span>
                    </Badge>
                    {conquista.descricao && (
                      <p className="text-xs text-muted-foreground">{conquista.descricao}</p>
                    )}
                  </li>
                ))}
              </ul>
            )
          ) : (
            <p className="text-sm text-muted-foreground">Emblemas privados</p>
          )}
        </CardContent>
      </Card>

      {perfil.ultimaMedida && (
        <Card className="mt-4" aria-label="Medidas">
          <CardHeader>
            <CardTitle>Última medida registrada</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
              {perfil.ultimaMedida.peso && (
                <li>Peso: {perfil.ultimaMedida.peso.toString()} kg</li>
              )}
              {perfil.ultimaMedida.cintura && (
                <li>Cintura: {perfil.ultimaMedida.cintura.toString()} cm</li>
              )}
              {perfil.ultimaMedida.quadril && (
                <li>Quadril: {perfil.ultimaMedida.quadril.toString()} cm</li>
              )}
              {perfil.ultimaMedida.braco && (
                <li>Braço: {perfil.ultimaMedida.braco.toString()} cm</li>
              )}
              {perfil.ultimaMedida.coxa && (
                <li>Coxa: {perfil.ultimaMedida.coxa.toString()} cm</li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      {perfil.fotos.length > 0 && (
        <Card className="mt-4" aria-label="Fotos de evolução">
          <CardHeader>
            <CardTitle>Fotos de evolução</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-3 gap-2">
              {perfil.fotos.map((foto) => (
                <li key={foto.id}>
                  <img
                    src={foto.urlAssinada}
                    alt="Foto de evolução"
                    className="aspect-square w-full rounded-lg object-cover"
                  />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card className="mt-4" aria-label="Posts">
        <CardHeader>
          <CardTitle>Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {perfil.posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum post ainda</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {perfil.posts.map((post) => (
                <li key={post.id} className="flex flex-col gap-2">
                  {post.urlImagem && (
                    <img
                      src={post.urlImagem}
                      alt="Imagem do post"
                      className="w-full rounded-lg object-cover"
                    />
                  )}
                  {post.texto && <p className="text-sm text-foreground">{post.texto}</p>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
