import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { podeAcessarAreaCliente } from "@/lib/auth/pode-acessar-painel";
import { obterPerfilProprio } from "./queries";
import { FormularioPerfil } from "./formulario-perfil";
import { Card, CardContent } from "@/components/ui/card";

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user || !podeAcessarAreaCliente(session.user.papeis)) {
    redirect("/");
  }

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
