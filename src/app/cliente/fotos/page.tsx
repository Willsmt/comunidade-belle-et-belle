import { listarFotos } from "./queries";
import { FormularioUpload } from "./formulario-upload";
import { ItemFoto } from "./item-foto";

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
            <ItemFoto
              key={foto.id}
              fotoId={foto.id}
              urlAssinada={foto.urlAssinada}
              data={foto.data.toLocaleDateString("pt-BR")}
              publica={foto.publica}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
