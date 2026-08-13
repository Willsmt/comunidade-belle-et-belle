import Link from "next/link";
import { listarDesafios } from "./queries";
import { listarEmblemas } from "./emblemas/queries";
import { encerrarDesafio } from "./actions";
import { BotaoComConfirmacao } from "@/components/botao-com-confirmacao";
import { FormularioCriarDesafio } from "./formulario-criar-desafio";
import { BotaoReabrirDesafio } from "./botao-reabrir-desafio";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DesafiosPage() {
  const [desafios, emblemas] = await Promise.all([listarDesafios(), listarEmblemas()]);

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6">
      <h1 className="font-heading text-2xl text-foreground">Desafios</h1>

      <Link
        href="/painel/desafios/emblemas"
        className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
      >
        Gerenciar emblemas
      </Link>

      <h2 className="mt-6 font-heading text-lg text-foreground">Nova edição</h2>
      <Card className="mt-2">
        <CardContent>
          <FormularioCriarDesafio emblemas={emblemas} />
        </CardContent>
      </Card>

      <h2 className="mt-6 font-heading text-lg text-foreground">Edições</h2>
      {desafios.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Nenhum desafio criado ainda.</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {desafios.map((desafio) => (
            <li key={desafio.id}>
              <Card>
                <CardContent className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-heading text-base text-foreground">
                      {desafio.titulo}
                    </span>
                    <Badge variant={desafio.ativo ? "secondary" : "outline"}>
                      {desafio.ativo ? "Ativo" : "Encerrado"}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {desafio.dataInicio.toLocaleDateString("pt-BR")} –{" "}
                    {desafio.dataFim.toLocaleDateString("pt-BR")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {desafio._count.categorias} categoria(s)
                  </span>
                  <Link
                    href={`/painel/desafios/${desafio.id}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Gerenciar categorias
                  </Link>

                  {desafio.ativo ? (
                    <BotaoComConfirmacao
                      label="Encerrar"
                      mensagemConfirmacao={`Encerrar o desafio "${desafio.titulo}"? Ele deixa de ser a edição ativa.`}
                      action={encerrarDesafio.bind(null, desafio.id)}
                    />
                  ) : (
                    <BotaoReabrirDesafio desafioId={desafio.id} />
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
