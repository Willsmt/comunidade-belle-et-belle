import { enviarFotoAntes, enviarFotoDepois } from "./actions";

export function FotosJornada({
  fotoAntesUrl,
  fotoDepoisUrl,
}: {
  fotoAntesUrl: string | null;
  fotoDepoisUrl: string | null;
}) {
  return (
    <section aria-label="Minhas fotos do desafio">
      <h2>Minhas fotos do desafio</h2>
      <div>
        <h3>Antes</h3>
        {fotoAntesUrl ? (
          <img src={fotoAntesUrl} alt="Foto de antes" width={150} />
        ) : (
          <p>Nenhuma foto enviada ainda</p>
        )}
        <form action={enviarFotoAntes} aria-label="Enviar foto de antes">
          <input name="foto" type="file" accept="image/*" required />
          <button type="submit">{fotoAntesUrl ? "Trocar foto" : "Enviar foto"}</button>
        </form>
      </div>
      <div>
        <h3>Depois</h3>
        {fotoDepoisUrl ? (
          <img src={fotoDepoisUrl} alt="Foto de depois" width={150} />
        ) : (
          <p>Nenhuma foto enviada ainda</p>
        )}
        <form action={enviarFotoDepois} aria-label="Enviar foto de depois">
          <input name="foto" type="file" accept="image/*" required />
          <button type="submit">{fotoDepoisUrl ? "Trocar foto" : "Enviar foto"}</button>
        </form>
      </div>
    </section>
  );
}
