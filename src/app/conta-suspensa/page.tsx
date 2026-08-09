import { sair } from "@/lib/auth/actions";

export default function ContaSuspensaPage() {
  return (
    <main>
      <h1>Conta suspensa</h1>
      <p>
        Sua conta foi suspensa. Entre em contato com a Patrícia para mais
        informações.
      </p>
      <form action={sair}>
        <button type="submit">Sair</button>
      </form>
    </main>
  );
}
