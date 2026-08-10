import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { podeAcessarAreaCliente } from "@/lib/auth/pode-acessar-painel";
import { listarFotos } from "./queries";
import { FormularioUpload } from "./formulario-upload";
import { ItemFoto } from "./item-foto";
import { Card, CardContent } from "@/components/ui/card";

export default async function FotosPage() {
  const session = await auth();
  if (!session?.user || !podeAcessarAreaCliente(session.user.papeis)) {
    redirect("/");
  }

  const fotos = await listarFotos();

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6">
      <h1 className="font-heading text-2xl text-foreground">Minhas fotos de evolução</h1>

      <h2 className="mt-6 font-heading text-lg text-foreground">Nova foto</h2>
      <Card className="mt-2">
        <CardContent>
          <FormularioUpload />
        </CardContent>
      </Card>

      <h2 className="mt-6 font-heading text-lg text-foreground">Galeria</h2>
      {fotos.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Nenhuma foto ainda.</p>
      ) : (
        <ul className="mt-2 grid grid-cols-2 gap-3">
          {fotos.map((foto) => (
            <ItemFoto
              key={foto.id}
              fotoId={foto.id}
              urlAssinada={foto.urlAssinada}
              data={foto.data.toLocaleDateString("pt-BR")}
              publica={foto.publica}
            />
          ))}
        </ul>
      )}
    </main>
  );
}
