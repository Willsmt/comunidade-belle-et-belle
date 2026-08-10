import { entrarComGoogle } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 py-10">
      <span className="font-heading text-2xl text-foreground">Belle et Belle</span>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <h1 className="font-heading text-xl text-foreground">Entrar</h1>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Acesse a comunidade Belle et Belle com sua conta Google.
          </p>
          <form action={entrarComGoogle}>
            <Button type="submit" className="w-full">
              Entrar com Google
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
