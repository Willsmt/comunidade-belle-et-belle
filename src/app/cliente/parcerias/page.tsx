import { listarParceriasVinculadas } from "./queries";

export default async function ParceriasPage() {
  const parcerias = await listarParceriasVinculadas();

  return (
    <section>
      <h1>Minhas parcerias</h1>
      {parcerias.length === 0 ? (
        <p>Nenhuma parceria vinculada ainda.</p>
      ) : (
        <ul>
          {parcerias.map((parceria) => (
            <li key={parceria.id}>
              {parceria.fotoUrl && (
                <img
                  src={parceria.fotoUrl}
                  alt={`Foto de ${parceria.nome}`}
                  width={80}
                  height={80}
                />
              )}
              <span>{parceria.nome}</span>
              {parceria.especialidade && <span>{parceria.especialidade}</span>}
              {parceria.bio && <p>{parceria.bio}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
