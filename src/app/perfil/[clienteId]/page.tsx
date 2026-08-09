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
          perfil.conquistas.length === 0 ? (
            <p>Nenhum emblema ainda</p>
          ) : (
            <ul>
              {perfil.conquistas.map((conquista) => (
                <li key={conquista.id}>
                  {conquista.icone && <span>{conquista.icone}</span>}
                  <span>{conquista.nome}</span>
                  {conquista.descricao && <span>{conquista.descricao}</span>}
                </li>
              ))}
            </ul>
          )
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
      {perfil.fotos.length > 0 && (
        <section aria-label="Fotos de evolução">
          <h2>Fotos de evolução</h2>
          <ul>
            {perfil.fotos.map((foto) => (
              <li key={foto.id}>
                <img
                  src={foto.urlAssinada}
                  alt="Foto de evolução"
                  width={200}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
      <section aria-label="Posts">
        <h2>Posts</h2>
        {perfil.posts.length === 0 ? (
          <p>Nenhum post ainda</p>
        ) : (
          <ul>
            {perfil.posts.map((post) => (
              <li key={post.id}>
                {post.urlImagem && (
                  <img
                    src={post.urlImagem}
                    alt="Imagem do post"
                    width={200}
                  />
                )}
                {post.texto && <p>{post.texto}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
