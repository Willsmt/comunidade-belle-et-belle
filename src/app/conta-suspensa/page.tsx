import Image from "next/image";
import { sair } from "@/lib/auth/actions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import logoBelleEtBelle from "../../../public/logo/logo-horizontal.svg";

export default function ContaSuspensaPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 py-10">
      <Image
        src={logoBelleEtBelle}
        alt="Belle et Belle"
        width={620}
        height={230}
        className="h-24 w-auto sm:h-50"
        priority
      />
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
