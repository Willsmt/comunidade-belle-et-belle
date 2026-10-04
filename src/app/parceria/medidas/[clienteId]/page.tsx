import { notFound } from "next/navigation";
import { obterMedidasDaCliente } from "./queries";
import { Card, CardContent } from "@/components/ui/card";
import { nomeParaExibicao } from "@/lib/nome-exibicao";

type Decimal = { toString(): string };
type Medida = Awaited<ReturnType<typeof obterMedidasDaCliente>>["medidas"][number];

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

export default async function MedidasDaClientePage({
  params,
}: {
  params: Promise<{ clienteId: string }>;
}) {
  const { clienteId } = await params;

  let dados: Awaited<ReturnType<typeof obterMedidasDaCliente>>;
  try {
    dados = await obterMedidasDaCliente(clienteId);
  } catch {
    notFound();
  }

  const { cliente, medidas } = dados;

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6">
      <h1 className="font-heading text-2xl text-foreground">
        Medidas — {nomeParaExibicao(cliente.name)}
      </h1>

      {medidas.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">Nenhum registro ainda.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
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
