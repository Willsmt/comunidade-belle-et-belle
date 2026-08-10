import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { podeAcessarAreaCliente } from "@/lib/auth/pode-acessar-painel";
import { listarMedidas } from "./queries";
import { FormularioRegistro } from "./formulario-registro";
import { GraficoEvolucao, type PontoEvolucao } from "./grafico-evolucao";
import { Card, CardContent } from "@/components/ui/card";

export default async function MedidasPage() {
  const session = await auth();
  if (!session?.user || !podeAcessarAreaCliente(session.user.papeis)) {
    redirect("/");
  }

  const medidas = await listarMedidas();

  const pontosGrafico: PontoEvolucao[] = medidas
    .map((medida) => ({
      data: medida.data.toISOString().slice(0, 10),
      peso: medida.peso?.toNumber() ?? null,
      cintura: medida.cintura?.toNumber() ?? null,
      quadril: medida.quadril?.toNumber() ?? null,
      braco: medida.braco?.toNumber() ?? null,
      coxa: medida.coxa?.toNumber() ?? null,
    }))
    .reverse();

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6">
      <h1 className="font-heading text-2xl text-foreground">Minhas medidas</h1>

      <h2 className="mt-6 font-heading text-lg text-foreground">Novo registro</h2>
      <Card className="mt-2">
        <CardContent>
          <FormularioRegistro />
        </CardContent>
      </Card>

      <h2 className="mt-6 font-heading text-lg text-foreground">Evolução</h2>
      <Card className="mt-2">
        <CardContent>
          <GraficoEvolucao pontos={pontosGrafico} />
        </CardContent>
      </Card>

      <h2 className="mt-6 font-heading text-lg text-foreground">Histórico</h2>
      {medidas.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Nenhum registro ainda.</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-3">
          {medidas.map((medida) => (
            <li key={medida.id}>
              <Card>
                <CardContent className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {medida.data.toLocaleDateString("pt-BR")}
                  </span>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-3">
                    <span>Peso: {medida.peso?.toString() ?? "—"} kg</span>
                    <span>Cintura: {medida.cintura?.toString() ?? "—"} cm</span>
                    <span>Quadril: {medida.quadril?.toString() ?? "—"} cm</span>
                    <span>Braço: {medida.braco?.toString() ?? "—"} cm</span>
                    <span>Coxa: {medida.coxa?.toString() ?? "—"} cm</span>
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
