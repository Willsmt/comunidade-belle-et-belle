import { listarClientesVinculadas, listarPlanosEnviados } from "./queries";
import { FormularioEnvio } from "./formulario-envio";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function PlanosPage() {
  const [clientes, planos] = await Promise.all([
    listarClientesVinculadas(),
    listarPlanosEnviados(),
  ]);

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6">
      <h1 className="font-heading text-2xl text-foreground">Meus planos</h1>

      <h2 className="mt-6 font-heading text-lg text-foreground">Enviar novo plano</h2>
      {clientes.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Nenhuma cliente vinculada a você ainda.
        </p>
      ) : (
        <Card className="mt-2">
          <CardContent>
            <FormularioEnvio clientes={clientes} />
          </CardContent>
        </Card>
      )}

      <h2 className="mt-6 font-heading text-lg text-foreground">Histórico de envios</h2>
      {planos.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Nenhum plano enviado ainda.</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {planos.map((plano) => (
            <li key={plano.id}>
              <Card>
                <CardContent className="flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {plano.cliente.name ?? plano.cliente.email}
                    </span>
                    {plano.titulo && (
                      <span className="text-xs text-muted-foreground">{plano.titulo}</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {plano.enviadoEm.toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <Badge variant="secondary">
                    {plano.tipo === "TREINO" ? "Treino" : "Dieta"}
                  </Badge>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
