"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requererPapel } from "@/lib/auth/requerer-acesso-painel";
import { AppError, executarAction } from "@/lib/actions/executar-action";

const CAMPOS_MEDIDA = [
  "peso",
  "altura",
  "ombro",
  "peitoBusto",
  "cintura",
  "abdomen",
  "quadril",
  "bracoDireito",
  "bracoEsquerdo",
  "antebracoDireito",
  "antebracoEsquerdo",
  "punhoDireito",
  "punhoEsquerdo",
  "coxaDireita",
  "coxaEsquerda",
  "joelhoDireito",
  "joelhoEsquerdo",
  "panturrilhaDireita",
  "panturrilhaEsquerda",
  "tornozeloDireito",
  "tornozeloEsquerdo",
] as const;

type Faixa = { min: number; max: number; rotulo: string };

// Faixas generosas de bom senso — limite de segurança contra erro de
// digitação, não precisão clínica.
const FAIXAS: Record<(typeof CAMPOS_MEDIDA)[number], Faixa> = {
  peso: { min: 20, max: 300, rotulo: "Peso" },
  altura: { min: 100, max: 250, rotulo: "Altura" },
  ombro: { min: 40, max: 200, rotulo: "Ombro" },
  peitoBusto: { min: 40, max: 200, rotulo: "Peito/busto" },
  cintura: { min: 40, max: 200, rotulo: "Cintura" },
  abdomen: { min: 40, max: 200, rotulo: "Abdômen" },
  quadril: { min: 40, max: 200, rotulo: "Quadril" },
  bracoDireito: { min: 8, max: 100, rotulo: "Braço D" },
  bracoEsquerdo: { min: 8, max: 100, rotulo: "Braço E" },
  antebracoDireito: { min: 8, max: 100, rotulo: "Antebraço D" },
  antebracoEsquerdo: { min: 8, max: 100, rotulo: "Antebraço E" },
  punhoDireito: { min: 8, max: 100, rotulo: "Punho D" },
  punhoEsquerdo: { min: 8, max: 100, rotulo: "Punho E" },
  coxaDireita: { min: 8, max: 100, rotulo: "Coxa D" },
  coxaEsquerda: { min: 8, max: 100, rotulo: "Coxa E" },
  joelhoDireito: { min: 8, max: 100, rotulo: "Joelho D" },
  joelhoEsquerdo: { min: 8, max: 100, rotulo: "Joelho E" },
  panturrilhaDireita: { min: 8, max: 100, rotulo: "Panturrilha D" },
  panturrilhaEsquerda: { min: 8, max: 100, rotulo: "Panturrilha E" },
  tornozeloDireito: { min: 8, max: 100, rotulo: "Tornozelo D" },
  tornozeloEsquerdo: { min: 8, max: 100, rotulo: "Tornozelo E" },
};

function parseNumero(formData: FormData, campo: string): number | undefined {
  const valor = formData.get(campo);
  if (typeof valor !== "string" || valor.trim() === "") {
    return undefined;
  }
  return Number(valor);
}

function parseData(formData: FormData): Date | undefined {
  const valor = formData.get("data");
  if (typeof valor !== "string" || valor.trim() === "") {
    return undefined;
  }
  return new Date(valor);
}

export async function criarRegistroMedida(formData: FormData) {
  return executarAction(async () => {
    const session = await requererPapel(["CLIENTE"]);

    const medidas = Object.fromEntries(
      CAMPOS_MEDIDA.map((campo) => [campo, parseNumero(formData, campo)]),
    ) as Record<(typeof CAMPOS_MEDIDA)[number], number | undefined>;

    if (CAMPOS_MEDIDA.every((campo) => medidas[campo] === undefined)) {
      throw new AppError("Preencha ao menos uma medida");
    }

    for (const campo of CAMPOS_MEDIDA) {
      const valor = medidas[campo];
      if (valor === undefined) continue;
      const { min, max, rotulo } = FAIXAS[campo];
      if (valor < min || valor > max) {
        throw new AppError(`${rotulo} deve estar entre ${min} e ${max}`);
      }
    }

    await prisma.registroMedida.create({
      data: {
        clienteId: session.user.id,
        data: parseData(formData),
        ...medidas,
      },
    });

    revalidatePath("/cliente/medidas");
  });
}
