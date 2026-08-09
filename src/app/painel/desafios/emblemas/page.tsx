import { listarEmblemas } from "./queries";
import { removerEmblema } from "./actions";
import { BotaoComConfirmacao } from "@/components/botao-com-confirmacao";
import { FormularioCriarEmblema } from "./formulario-criar-emblema";
import { Card, CardContent } from "@/components/ui/card";

export default async function EmblemasPage() {
  const emblemas = await listarEmblemas();

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6">
      <h1 className="font-heading text-2xl text-foreground">Emblemas</h1>

      <h2 className="mt-6 font-heading text-lg text-foreground">Novo emblema</h2>
      <Card className="mt-2">
        <CardContent>
          <FormularioCriarEmblema />
        </CardContent>
      </Card>

      <h2 className="mt-6 font-heading text-lg text-foreground">Catálogo</h2>
      {emblemas.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Nenhum emblema criado ainda.</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {emblemas.map((emblema) => (
            <li key={emblema.id}>
              <Card>
                <CardContent className="flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {emblema.nome}
                    </span>
                    {emblema.descricao && (
                      <span className="text-xs text-muted-foreground">
                        {emblema.descricao}
                      </span>
                    )}
                  </div>
                  <BotaoComConfirmacao
                    label="Remover"
                    mensagemConfirmacao={`Remover o emblema "${emblema.nome}"? Isso só é possível se ele nunca foi atribuído a ninguém.`}
                    action={removerEmblema.bind(null, emblema.id)}
                  />
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
