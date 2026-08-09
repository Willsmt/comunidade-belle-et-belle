import { obterPerfilParceriaProprio } from "./queries";
import { FormularioPerfilParceria } from "./formulario-perfil-parceria";
import { gerarUrlAssinada } from "@/lib/storage/parcerias";
import { Card, CardContent } from "@/components/ui/card";

export default async function PerfilParceriaPage() {
  const perfil = await obterPerfilParceriaProprio();
  const fotoUrl = perfil?.fotoChave
    ? await gerarUrlAssinada(perfil.fotoChave)
    : null;

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6">
      <h1 className="font-heading text-2xl text-foreground">Meu perfil</h1>
      <Card className="mt-4">
        <CardContent>
          <FormularioPerfilParceria perfil={perfil} fotoUrl={fotoUrl} />
        </CardContent>
      </Card>
    </main>
  );
}
