import { listarVinculos, listarClientesEParcerias } from "./queries";
import { desativarVinculo } from "./actions";
import { BotaoComConfirmacao } from "@/components/botao-com-confirmacao";
import { FormularioCriarVinculo } from "./formulario-criar-vinculo";
import { BotaoReativarVinculo } from "./botao-reativar-vinculo";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function VinculosPage() {
  const [vinculos, { clientes, parcerias }] = await Promise.all([
    listarVinculos(),
    listarClientesEParcerias(),
  ]);

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6">
      <h1 className="font-heading text-2xl text-foreground">
        Vínculos cliente-parceria
      </h1>

      <h2 className="mt-6 font-heading text-lg text-foreground">Novo vínculo</h2>
      <Card className="mt-2">
        <CardContent>
          <FormularioCriarVinculo clientes={clientes} parcerias={parcerias} />
        </CardContent>
      </Card>

      <h2 className="mt-6 font-heading text-lg text-foreground">
        Vínculos existentes
      </h2>
      {vinculos.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Nenhum vínculo ainda.</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {vinculos.map((vinculo) => (
            <li key={vinculo.id}>
              <Card>
                <CardContent className="flex items-center justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-foreground">
                      {vinculo.cliente.name ?? vinculo.cliente.email}
                      {" ↔ "}
                      {vinculo.parceria.name ?? vinculo.parceria.email}
                    </span>
                    <Badge
                      variant={vinculo.ativo ? "secondary" : "destructive"}
                      className="w-fit"
                    >
                      {vinculo.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>

                  {vinculo.ativo ? (
                    <BotaoComConfirmacao
                      label="Desativar"
                      mensagemConfirmacao={`Desativar o vínculo entre ${
                        vinculo.cliente.name ?? vinculo.cliente.email
                      } e ${
                        vinculo.parceria.name ?? vinculo.parceria.email
                      }? A parceria deixa de ver essa cliente.`}
                      action={desativarVinculo.bind(null, vinculo.id)}
                    />
                  ) : (
                    <BotaoReativarVinculo vinculoId={vinculo.id} />
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
