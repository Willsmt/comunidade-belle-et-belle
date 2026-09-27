// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import MedidasPage, { valorMembro } from "./page";
import { redirect } from "next/navigation";
import { listarMedidas } from "./queries";
import { criarRegistroMedida } from "./actions";

const { mockRefresh, mockAuth } = vi.hoisted(() => ({
  mockRefresh: vi.fn(),
  mockAuth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("@/auth", () => ({ auth: mockAuth }));

vi.mock("./queries", () => ({
  listarMedidas: vi.fn(),
}));

vi.mock("./actions", () => ({
  criarRegistroMedida: vi.fn(),
  editarRegistroMedida: vi.fn(),
  excluirRegistroMedida: vi.fn(),
}));

vi.mock("./grafico-evolucao", () => ({
  GraficoEvolucao: () => null,
}));

function dec(valor: number) {
  return { toNumber: () => valor, toString: () => String(valor) };
}

describe("valorMembro", () => {
  it("retorna a média quando os dois lados existem", () => {
    expect(valorMembro(30, 28)).toBe(29);
  });

  it("retorna o lado direito quando só ele existe", () => {
    expect(valorMembro(30, null)).toBe(30);
  });

  it("retorna o lado esquerdo quando só ele existe", () => {
    expect(valorMembro(null, 28)).toBe(28);
  });

  it("cai para o valor legado quando nenhum lado existe", () => {
    expect(valorMembro(null, null, 27)).toBe(27);
  });

  it("arredonda a média para 2 casas decimais, sem sobra de ponto flutuante (ex.: 30 e 29.99)", () => {
    const resultado = valorMembro(30, 29.99);
    expect(resultado).toBe(29.99);
    expect(String(resultado)).toBe("29.99");
  });

  it("retorna null quando nenhum dos três existe", () => {
    expect(valorMembro(null, null)).toBeNull();
  });
});

describe("MedidasPage", () => {
  beforeEach(() => {
    mockRefresh.mockClear();
    vi.mocked(listarMedidas).mockReset();
    vi.mocked(criarRegistroMedida).mockReset();
    mockAuth.mockReset();
    mockAuth.mockResolvedValue({ user: { papeis: ["CLIENTE"] } });
  });

  it("renderiza o formulário de novo registro", async () => {
    vi.mocked(listarMedidas).mockResolvedValue([]);

    render(await MedidasPage());

    expect(
      screen.getByRole("form", { name: /novo registro de medidas/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/peso/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/altura/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /salvar registro/i }),
    ).toBeInTheDocument();
  });

  it("os campos numéricos têm min/max de acordo com a faixa de cada grupo", async () => {
    vi.mocked(listarMedidas).mockResolvedValue([]);

    render(await MedidasPage());

    expect(screen.getByLabelText(/^peso/i)).toHaveAttribute("min", "20");
    expect(screen.getByLabelText(/^peso/i)).toHaveAttribute("max", "300");
    expect(screen.getByLabelText(/^altura/i)).toHaveAttribute("min", "100");
    expect(screen.getByLabelText(/^altura/i)).toHaveAttribute("max", "250");
    expect(screen.getByLabelText(/^ombro/i)).toHaveAttribute("min", "40");
    expect(screen.getByLabelText(/^ombro/i)).toHaveAttribute("max", "200");
    expect(screen.getByLabelText(/^braço d/i)).toHaveAttribute("min", "8");
    expect(screen.getByLabelText(/^braço d/i)).toHaveAttribute("max", "100");
  });

  it("perde o foco ao rolar a roda do mouse sobre um campo numérico, pra não alterar o valor por acidente", async () => {
    vi.mocked(listarMedidas).mockResolvedValue([]);

    render(await MedidasPage());

    const campoPeso = screen.getByLabelText(/^peso/i);
    campoPeso.focus();
    expect(campoPeso).toHaveFocus();

    fireEvent.wheel(campoPeso);

    expect(campoPeso).not.toHaveFocus();
  });

  it("ao submeter: chama a action e dá refresh na rota", async () => {
    vi.mocked(listarMedidas).mockResolvedValue([]);
    vi.mocked(criarRegistroMedida).mockResolvedValue(undefined);

    render(await MedidasPage());

    fireEvent.change(screen.getByLabelText(/peso/i), {
      target: { value: "60.5" },
    });
    fireEvent.click(screen.getByRole("button", { name: /salvar registro/i }));

    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
    expect(criarRegistroMedida).toHaveBeenCalledTimes(1);
  });

  it("mostra a mensagem real do erro (ex.: faixa de validação), sem dar refresh", async () => {
    vi.mocked(listarMedidas).mockResolvedValue([]);
    vi.mocked(criarRegistroMedida).mockRejectedValue(
      new Error("Peso deve estar entre 20 e 300"),
    );

    render(await MedidasPage());

    fireEvent.click(screen.getByRole("button", { name: /salvar registro/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        /peso deve estar entre 20 e 300/i,
      ),
    );
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("redireciona quem não tem papel CLIENTE, sem buscar as medidas", async () => {
    mockAuth.mockResolvedValue({ user: { papeis: ["GESTORA"] } });

    await expect(MedidasPage()).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/");
    expect(listarMedidas).not.toHaveBeenCalled();
  });

  it("um registro antigo (só braco/coxa, sem os campos novos) aparece no histórico com os campos novos em branco", async () => {
    vi.mocked(listarMedidas).mockResolvedValue([
      {
        id: "m1",
        data: new Date("2026-01-10"),
        peso: dec(60),
        altura: null,
        ombro: null,
        peitoBusto: null,
        cintura: dec(70),
        abdomen: null,
        quadril: dec(95),
        bracoDireito: null,
        bracoEsquerdo: null,
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
        braco: dec(28),
        coxa: dec(55),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any);

    render(await MedidasPage());

    expect(screen.getByText(/altura: — cm/i)).toBeInTheDocument();
    expect(screen.getByText(/ombro: — cm/i)).toBeInTheDocument();
    expect(screen.getByText(/braço\/coxa \(registro anterior\): 28 \/ 55 cm/i)).toBeInTheDocument();
  });

  it("um registro novo com valores assimétricos mostra os dois lados distintos, e um lado não preenchido mostra —", async () => {
    vi.mocked(listarMedidas).mockResolvedValue([
      {
        id: "m2",
        data: new Date("2026-02-10"),
        peso: null,
        altura: null,
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
        joelhoDireito: dec(40),
        joelhoEsquerdo: null,
        panturrilhaDireita: null,
        panturrilhaEsquerda: null,
        tornozeloDireito: null,
        tornozeloEsquerdo: null,
        braco: null,
        coxa: null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    ]);

    render(await MedidasPage());

    expect(screen.getByText(/braço d\/e: 30 \/ 28 cm/i)).toBeInTheDocument();
    expect(screen.getByText(/joelho d\/e: 40 \/ — cm/i)).toBeInTheDocument();
  });
});
