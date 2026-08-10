import Link from "next/link";
import { redirect } from "next/navigation";
import { Download } from "lucide-react";
import { auth } from "@/auth";
import { podeAcessarAreaCliente } from "@/lib/auth/pode-acessar-painel";
import { listarPlanosRecebidos } from "./queries";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function PlanosRecebidosPage() {
  const session = await auth();
  if (!session?.user || !podeAcessarAreaCliente(session.user.papeis)) {
    redirect("/");
  }

  const planos = await listarPlanosRecebidos();

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl text-foreground">Meus planos</h1>
        <Link
          href="/cliente/parcerias"
          className="text-sm font-medium text-primary hover:underline"
        >
          Ver minhas parcerias
        </Link>
      </div>

      {planos.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Nenhum plano recebido ainda.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {planos.map((plano) => (
            <li key={plano.id}>
              <Card>
                <CardContent className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary">
                      {plano.tipo === "TREINO" ? "Treino" : "Dieta"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {plano.enviadoEm.toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  {plano.titulo && (
                    <p className="font-heading text-base text-foreground">{plano.titulo}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {plano.parceria.name ?? plano.parceria.email}
                  </p>
                  <a
                    href={plano.urlAssinada}
                    target="_blank"
                    rel="noreferrer"
                    className={`${buttonVariants({ variant: "outline", size: "sm" })} self-start`}
                  >
                    <Download className="size-3.5" />
                    Ver PDF
                  </a>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
