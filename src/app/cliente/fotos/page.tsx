import { listarFotos } from "./queries";
import { FormularioUpload } from "./formulario-upload";
import { alternarVisibilidadeFoto, excluirFoto } from "./actions";

export default async function FotosPage() {
  const fotos = await listarFotos();

  return (
    <section>
      <h1>Minhas fotos de evolução</h1>

      <h2>Nova foto</h2>
      <FormularioUpload />

      <h2>Galeria</h2>
      {fotos.length === 0 ? (
        <p>Nenhuma foto ainda.</p>
      ) : (
        <ul>
          {fotos.map((foto) => (
            <li key={foto.id}>
              <img src={foto.urlAssinada} alt="Foto de evolução" width={200} />
              <p>{foto.data.toLocaleDateString("pt-BR")}</p>
              <p>{foto.publica ? "Pública" : "Privada"}</p>

              <form action={alternarVisibilidadeFoto}>
                <input type="hidden" name="fotoId" value={foto.id} />
                <button type="submit">
                  {foto.publica ? "Tornar privada" : "Tornar pública"}
                </button>
              </form>

              <form action={excluirFoto}>
                <input type="hidden" name="fotoId" value={foto.id} />
                <button type="submit">Excluir</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
