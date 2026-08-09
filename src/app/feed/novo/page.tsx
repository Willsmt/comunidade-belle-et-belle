import { auth } from "@/auth";
import { criarPost } from "../actions";
import { listarFotosEvolucaoDoUsuario } from "../queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function NovoPostPage() {
  const session = await auth();
  const fotosEvolucao = session?.user
    ? await listarFotosEvolucaoDoUsuario(session.user.id)
    : [];

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6">
      <h1 className="font-heading text-2xl text-foreground">Novo post</h1>

      <Card className="mt-4">
        <CardContent>
          <form action={criarPost} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
              Texto (opcional)
              <textarea
                name="texto"
                rows={4}
                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
              Imagem nova (opcional)
              <input
                type="file"
                name="arquivo"
                accept="image/jpeg,image/png,image/webp"
                className="text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground"
              />
            </label>

            {fotosEvolucao.length > 0 && (
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1 text-sm font-medium text-foreground">
                  Ou escolha uma foto de evolução já enviada
                </legend>
                <div className="flex flex-wrap gap-2">
                  {fotosEvolucao.map((foto) => (
                    <label
                      key={foto.id}
                      className="cursor-pointer rounded-lg ring-2 ring-transparent has-[:checked]:ring-primary"
                    >
                      <input
                        type="radio"
                        name="fotoEvolucaoId"
                        value={foto.id}
                        className="sr-only"
                      />
                      <img
                        src={foto.urlAssinada}
                        alt="Foto de evolução"
                        className="size-20 rounded-lg object-cover"
                      />
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <Button type="submit">Publicar</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
