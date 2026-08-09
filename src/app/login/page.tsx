import { entrarComGoogle } from "./actions";

export default function LoginPage() {
  return (
    <main>
      <h1>Entrar</h1>
      <p>Acesse a comunidade Belle et Belle com sua conta Google.</p>
      <form action={entrarComGoogle}>
        <button type="submit">Entrar com Google</button>
      </form>
    </main>
  );
}
