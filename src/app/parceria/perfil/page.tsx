import { obterPerfilParceriaProprio } from "./queries";
import { FormularioPerfilParceria } from "./formulario-perfil-parceria";
import { gerarUrlAssinada } from "@/lib/storage/parcerias";

export default async function PerfilParceriaPage() {
  const perfil = await obterPerfilParceriaProprio();
  const fotoUrl = perfil?.fotoChave
    ? await gerarUrlAssinada(perfil.fotoChave)
    : null;

  return (
    <section>
      <h1>Meu perfil</h1>
      <FormularioPerfilParceria perfil={perfil} fotoUrl={fotoUrl} />
    </section>
  );
}
