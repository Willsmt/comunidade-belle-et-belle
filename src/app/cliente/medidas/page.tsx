import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { podeAcessarAreaCliente } from "@/lib/auth/pode-acessar-painel";
import { listarMedidas } from "./queries";
import { CAMPOS_MEDIDA } from "./campos";
import { FormularioRegistro } from "./formulario-registro";
import { CardMedida } from "./card-medida";
import { GraficoEvolucao, type PontoEvolucao } from "./grafico-evolucao";
import { Card, CardContent } from "@/components/ui/card";

type Decimal = { toNumber(): number; toString(): string };
type Medida = Awaited<ReturnType<typeof listarMedidas>>[number];

const CAMPOS_SERIALIZAVEIS = [...CAMPOS_MEDIDA, "braco", "coxa"] as const;

function serializarMedida(medida: Medida): Record<string, string> {
  const valores: Record<string, string> = {
    data: medida.data.toISOString().slice(0, 10),
  };
  for (const campo of CAMPOS_SERIALIZAVEIS) {
    valores[campo] = medida[campo]?.toString() ?? "";
  }
  return valores;
}

export function valorMembro(
  direito: number | null,
  esquerdo: number | null,
  legado: number | null = null,
): number | null {
  const bruto =
    direito != null && esquerdo != null
      ? (direito + esquerdo) / 2
      : direito ?? esquerdo ?? legado;
  return bruto == null ? null : Number(bruto.toFixed(2));
}

function paraNumero(valor: Decimal | null): number | null {
  return valor?.toNumber() ?? null;
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
              <CardMedida
                id={medida.id}
                dataFormatada={medida.data.toLocaleDateString("pt-BR")}
                valores={serializarMedida(medida)}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
