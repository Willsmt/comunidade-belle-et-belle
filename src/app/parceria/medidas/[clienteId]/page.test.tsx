// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import MedidasDaClientePage from "./page";
import { obterMedidasDaCliente } from "./queries";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("./queries", () => ({
  obterMedidasDaCliente: vi.fn(),
}));

function dec(valor: number) {
  return { toString: () => String(valor) };
}

describe("MedidasDaClientePage", () => {
  it("renderiza o nome da cliente e o histórico completo, incluindo os dois lados de uma medida de membro", async () => {
    vi.mocked(obterMedidasDaCliente).mockResolvedValue({
      cliente: { id: "c1", name: "Cliente 1" },
      medidas: [
        {
          id: "m1",
          data: new Date("2026-03-01"),
          peso: dec(60),
          altura: dec(165),
          ombro: null,
          peitoBusto: null,
          cintura: null,
          abdomen: null,
          quadril: null,
          bracoDireito: dec(30),
          bracoEsquerdo: dec(28),
          antebracoDireito: null,
          antebracoEsquerdo: null,
          punhoDireito: null,
          punhoEsquerdo: null,
          coxaDireita: null,
          coxaEsquerda: null,
          joelhoDireito: null,
          joelhoEsquerdo: null,
          panturrilhaDireita: null,
          panturrilhaEsquerda: null,
          tornozeloDireito: null,
          tornozeloEsquerdo: null,
          braco: null,
          coxa: null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      ],
    });

    render(
      await MedidasDaClientePage({
        params: Promise.resolve({ clienteId: "c1" }),
      }),
    );

    expect(screen.getByText(/medidas — cliente 1/i)).toBeInTheDocument();
    expect(screen.getByText(/braço d\/e: 30 \/ 28 cm/i)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
  });

  it("mostra estado vazio quando a cliente não tem nenhum registro", async () => {
    vi.mocked(obterMedidasDaCliente).mockResolvedValue({
      cliente: { id: "c1", name: "Cliente 1" },
      medidas: [],
    });

    render(
      await MedidasDaClientePage({
        params: Promise.resolve({ clienteId: "c1" }),
      }),
    );

    expect(screen.getByText(/nenhum registro ainda/i)).toBeInTheDocument();
  });

  it("chama notFound() e não renderiza dado da cliente quando o acesso é negado", async () => {
    vi.mocked(obterMedidasDaCliente).mockRejectedValue(
      new Error("Cliente não vinculada a você"),
    );

    await expect(
      MedidasDaClientePage({ params: Promise.resolve({ clienteId: "c1" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
