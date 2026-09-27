import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { podeAcessarAreaCliente } from "@/lib/auth/pode-acessar-painel";
import { listarMedidas } from "./queries";
import { FormularioRegistro } from "./formulario-registro";
import { GraficoEvolucao, type PontoEvolucao } from "./grafico-evolucao";
import { Card, CardContent } from "@/components/ui/card";

type Decimal = { toNumber(): number; toString(): string };
type Medida = Awaited<ReturnType<typeof listarMedidas>>[number];

export function valorMembro(
  direito: number | null,
  esquerdo: number | null,
  legado: number | null = null,
): number | null {
  if (direito != null && esquerdo != null) return (direito + esquerdo) / 2;
  if (direito != null) return direito;
  if (esquerdo != null) return esquerdo;
  return legado;
}

function paraNumero(valor: Decimal | null): number | null {
  return valor?.toNumber() ?? null;
}

const MEDIDAS_TRONCO = [
  { chave: "ombro" as const, rotulo: "Ombro" },
  { chave: "peitoBusto" as const, rotulo: "Peito/busto" },
  { chave: "cintura" as const, rotulo: "Cintura" },
  { chave: "abdomen" as const, rotulo: "Abdômen" },
  { chave: "quadril" as const, rotulo: "Quadril" },
];

const MEDIDAS_MEMBRO = [
  { rotulo: "Braço", direito: "bracoDireito" as const, esquerdo: "bracoEsquerdo" as const },
  { rotulo: "Antebraço", direito: "antebracoDireito" as const, esquerdo: "antebracoEsquerdo" as const },
  { rotulo: "Punho", direito: "punhoDireito" as const, esquerdo: "punhoEsquerdo" as const },
  { rotulo: "Coxa", direito: "coxaDireita" as const, esquerdo: "coxaEsquerda" as const },
  { rotulo: "Joelho", direito: "joelhoDireito" as const, esquerdo: "joelhoEsquerdo" as const },
  { rotulo: "Panturrilha", direito: "panturrilhaDireita" as const, esquerdo: "panturrilhaEsquerda" as const },
  { rotulo: "Tornozelo", direito: "tornozeloDireito" as const, esquerdo: "tornozeloEsquerdo" as const },
];

function formatarValor(valor: Decimal | null): string {
  return valor?.toString() ?? "—";
}

export default async function MedidasPage() {
  const session = await auth();
  if (!session?.user || !podeAcessarAreaCliente(session.user.papeis)) {
    redirect("/");
  }

  const medidas = await listarMedidas();

  const pontosGrafico: PontoEvolucao[] = medidas
    .map((medida) => ({
      data: medida.data.toISOString().slice(0, 10),
      peso: paraNumero(medida.peso),
      ombro: paraNumero(medida.ombro),
      peitoBusto: paraNumero(medida.peitoBusto),
      cintura: paraNumero(medida.cintura),
      abdomen: paraNumero(medida.abdomen),
      quadril: paraNumero(medida.quadril),
      braco: valorMembro(
        paraNumero(medida.bracoDireito),
        paraNumero(medida.bracoEsquerdo),
        paraNumero(medida.braco),
      ),
      antebraco: valorMembro(paraNumero(medida.antebracoDireito), paraNumero(medida.antebracoEsquerdo)),
      punho: valorMembro(paraNumero(medida.punhoDireito), paraNumero(medida.punhoEsquerdo)),
      coxa: valorMembro(
        paraNumero(medida.coxaDireita),
        paraNumero(medida.coxaEsquerda),
        paraNumero(medida.coxa),
      ),
      joelho: valorMembro(paraNumero(medida.joelhoDireito), paraNumero(medida.joelhoEsquerdo)),
      panturrilha: valorMembro(
        paraNumero(medida.panturrilhaDireita),
        paraNumero(medida.panturrilhaEsquerda),
      ),
      tornozelo: valorMembro(paraNumero(medida.tornozeloDireito), paraNumero(medida.tornozeloEsquerdo)),
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
          {medidas.map((medida: Medida) => (
            <li key={medida.id}>
              <Card>
                <CardContent className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {medida.data.toLocaleDateString("pt-BR")}
                  </span>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-3">
                    <span>Peso: {formatarValor(medida.peso)} kg</span>
                    <span>Altura: {formatarValor(medida.altura)} cm</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-3">
                    {MEDIDAS_TRONCO.map((item) => (
                      <span key={item.chave}>
                        {item.rotulo}: {formatarValor(medida[item.chave])} cm
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-3">
                    {MEDIDAS_MEMBRO.map((item) => (
                      <span key={item.direito}>
                        {item.rotulo} D/E: {formatarValor(medida[item.direito])} /{" "}
                        {formatarValor(medida[item.esquerdo])} cm
                      </span>
                    ))}
                    {(medida.braco || medida.coxa) && (
                      <span>
                        Braço/coxa (registro anterior): {formatarValor(medida.braco)} /{" "}
                        {formatarValor(medida.coxa)} cm
                      </span>
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
