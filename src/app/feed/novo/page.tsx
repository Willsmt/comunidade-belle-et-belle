import { auth } from "@/auth";
import { criarPost } from "../actions";
import { listarFotosEvolucaoDoUsuario } from "../queries";

export default async function NovoPostPage() {
  const session = await auth();
  const fotosEvolucao = session?.user
    ? await listarFotosEvolucaoDoUsuario(session.user.id)
    : [];

  return (
    <section>
      <h1>Novo post</h1>

      <form action={criarPost}>
        <label>
          Texto (opcional)
          <textarea name="texto" rows={4} />
        </label>

        <label>
          Imagem nova (opcional)
          <input
            type="file"
            name="arquivo"
            accept="image/jpeg,image/png,image/webp"
          />
        </label>

        {fotosEvolucao.length > 0 && (
          <fieldset>
            <legend>Ou escolha uma foto de evolução já enviada</legend>
            {fotosEvolucao.map((foto) => (
              <label key={foto.id}>
                <input type="radio" name="fotoEvolucaoId" value={foto.id} />
                <img src={foto.urlAssinada} alt="Foto de evolução" width={100} />
              </label>
            ))}
          </fieldset>
        )}

        <button type="submit">Publicar</button>
      </form>
    </section>
  );
}
