import Link from "next/link";
import { listarClientesVinculadas } from "./queries";
import { Card, CardContent } from "@/components/ui/card";

export default async function MedidasParceriaPage() {
  const clientes = await listarClientesVinculadas();

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6">
      <h1 className="font-heading text-2xl text-foreground">Medidas das clientes</h1>

      {clientes.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Nenhuma cliente vinculada a você ainda.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {clientes.map((cliente) => (
            <li key={cliente.id}>
              <Link href={`/parceria/medidas/${cliente.id}`}>
                <Card className="transition-colors hover:bg-accent">
                  <CardContent>
                    <span className="text-sm font-medium text-foreground">
                      {cliente.name ?? cliente.email}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
