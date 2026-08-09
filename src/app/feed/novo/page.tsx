import { auth } from "@/auth";
import { listarFotosEvolucaoDoUsuario } from "../queries";
import { Card, CardContent } from "@/components/ui/card";
import { FormularioNovoPost } from "./formulario-novo-post";

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
          <FormularioNovoPost fotosEvolucao={fotosEvolucao} />
        </CardContent>
      </Card>
    </main>
  );
}
