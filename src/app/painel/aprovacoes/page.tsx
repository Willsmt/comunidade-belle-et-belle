import { listarPendentes } from "./queries";
import { rejeitarConta } from "./actions";
import { BotaoComConfirmacao } from "@/components/botao-com-confirmacao";
import { BotaoAprovarConta } from "./botao-aprovar-conta";
import { Card, CardContent } from "@/components/ui/card";

export default async function AprovacoesPage() {
  const pendentes = await listarPendentes();

  if (pendentes.length === 0) {
    return (
      <main className="mx-auto w-full max-w-lg px-4 py-6">
        <h1 className="font-heading text-2xl text-foreground">Aprovações pendentes</h1>
        <p className="mt-6 text-sm text-muted-foreground">
          Nenhum pedido pendente no momento.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6">
      <h1 className="font-heading text-2xl text-foreground">Aprovações pendentes</h1>
      <ul className="mt-6 flex flex-col gap-4">
        {pendentes.map((usuario) => (
          <li key={usuario.id}>
            <Card>
              <CardContent className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-foreground">
                  {usuario.name ?? usuario.email}
                </span>
                <div className="flex items-center gap-2">
                  <BotaoAprovarConta userId={usuario.id} />
                  <BotaoComConfirmacao
                    label="Rejeitar"
                    mensagemConfirmacao={`Rejeitar o pedido de ${usuario.name ?? usuario.email}? Essa ação não pode ser desfeita.`}
                    action={rejeitarConta.bind(null, usuario.id)}
                  />
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </main>
  );
}
