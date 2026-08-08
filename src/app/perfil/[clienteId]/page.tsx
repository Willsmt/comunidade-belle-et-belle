import { notFound } from "next/navigation";
import { obterPerfilPublico } from "./queries";

export default async function PerfilPublicoPage({
  params,
}: {
  params: Promise<{ clienteId: string }>;
}) {
  const { clienteId } = await params;
  const perfil = await obterPerfilPublico(clienteId);

  if (!perfil) {
    notFound();
  }

  return (
    <div>
      <h1>{perfil.nome}</h1>

      {perfil.bio && <p>{perfil.bio}</p>}

      <section aria-label="Emblemas">
        <h2>Emblemas</h2>
        {perfil.emblemasPublicos ? (
          <p>Nenhum emblema ainda</p>
        ) : (
          <p>Emblemas privados</p>
        )}
      </section>

      {perfil.ultimaMedida && (
        <section aria-label="Medidas">
          <h2>Última medida registrada</h2>
          <ul>
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
        </section>
      )}
    </div>
  );
}
