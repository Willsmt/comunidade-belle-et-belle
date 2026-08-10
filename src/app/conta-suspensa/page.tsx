import { sair } from "@/lib/auth/actions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ContaSuspensaPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 py-10">
      <span className="font-heading text-2xl text-foreground">Belle et Belle</span>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <h1 className="font-heading text-xl text-foreground">Conta suspensa</h1>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Sua conta foi suspensa. Entre em contato com a Patrícia para mais
            informações.
          </p>
          <form action={sair}>
            <button
              type="submit"
              className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
            >
              Sair
            </button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
