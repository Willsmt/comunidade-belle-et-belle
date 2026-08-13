import { redirect } from "next/navigation";
import Image from "next/image";
import { auth } from "@/auth";
import { podeAcessarAreaCliente } from "@/lib/auth/pode-acessar-painel";
import { listarParceriasVinculadas } from "./queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ParceriasPage() {
  const session = await auth();
  if (!session?.user || !podeAcessarAreaCliente(session.user.papeis)) {
    redirect("/");
  }

  const parcerias = await listarParceriasVinculadas();

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6">
      <h1 className="font-heading text-2xl text-foreground">Minhas parcerias</h1>

      {parcerias.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Nenhuma parceria vinculada ainda.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {parcerias.map((parceria) => (
            <li key={parceria.id}>
              <Card>
                <CardContent className="flex items-center gap-3">
                  {parceria.fotoUrl && (
                    <Image
                      src={parceria.fotoUrl}
                      alt={`Foto de ${parceria.nome}`}
                      width={64}
                      height={64}
                      className="size-16 shrink-0 rounded-full object-cover"
                    />
                  )}
                  <div className="flex flex-col gap-1">
                    <span className="font-heading text-base text-foreground">
                      {parceria.nome}
                    </span>
                    {parceria.especialidade && (
                      <Badge variant="secondary" className="w-fit">
                        {parceria.especialidade}
                      </Badge>
                    )}
                    {parceria.bio && (
                      <p className="text-sm text-muted-foreground">{parceria.bio}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
