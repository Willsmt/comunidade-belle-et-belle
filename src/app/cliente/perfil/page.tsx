import { obterPerfilProprio } from "./queries";
import { FormularioPerfil } from "./formulario-perfil";
import { Card, CardContent } from "@/components/ui/card";

export default async function PerfilPage() {
  const perfil = await obterPerfilProprio();

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6">
      <h1 className="font-heading text-2xl text-foreground">Meu perfil</h1>
      <Card className="mt-4">
        <CardContent>
          <FormularioPerfil perfil={perfil} />
        </CardContent>
      </Card>
    </main>
  );
}
