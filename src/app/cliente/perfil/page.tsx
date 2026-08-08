import { obterPerfilProprio } from "./queries";
import { FormularioPerfil } from "./formulario-perfil";

export default async function PerfilPage() {
  const perfil = await obterPerfilProprio();

  return (
    <section>
      <h1>Meu perfil</h1>
      <FormularioPerfil perfil={perfil} />
    </section>
  );
}
