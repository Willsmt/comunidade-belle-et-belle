// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import MembroPacotePage from "./page";
import { obterMembro, obterCicloAtivo, listarHistoricoCiclos } from "./queries";
import { listarTiposPacote } from "../../pacotes/queries";
import { vincularPacote } from "./actions";

vi.mock("./queries", () => ({
  obterMembro: vi.fn(),
  obterCicloAtivo: vi.fn(),
  listarHistoricoCiclos: vi.fn(),
}));

vi.mock("../../pacotes/queries", () => ({
  listarTiposPacote: vi.fn(),
}));

vi.mock("./actions", () => ({
  vincularPacote: vi.fn(),
  marcarSessaoRealizada: vi.fn(),
  desfazerSessaoRealizada: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

function buildParams(membroId: string) {
  return Promise.resolve({ membroId });
}

describe("MembroPacotePage", () => {
  beforeEach(() => {
    vi.mocked(listarHistoricoCiclos).mockResolvedValue([]);
  });

  it("chama notFound quando a cliente não existe", async () => {
    vi.mocked(obterMembro).mockResolvedValue(null);
    vi.mocked(obterCicloAtivo).mockResolvedValue(null);
    vi.mocked(listarTiposPacote).mockResolvedValue([]);

    await expect(
      MembroPacotePage({ params: buildParams("nao-existe") }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("sem ciclo ativo, mostra aviso claro e o formulário de vincular, sem contadores", async () => {
    vi.mocked(obterMembro).mockResolvedValue({
      id: "cliente-1",
      name: "Ana",
      email: "ana@x.com",
    } as never);
    vi.mocked(obterCicloAtivo).mockResolvedValue(null);
    vi.mocked(listarTiposPacote).mockResolvedValue([
      { id: "tp1", nome: "Projeto Corpo dos Sonhos", ativo: true, criadoEm: new Date(), itens: [] },
    ] as never);

    render(await MembroPacotePage({ params: buildParams("cliente-1") }));

    expect(
      screen.getByText(/esta cliente não tem nenhum pacote de sessões ativo/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("form", { name: /vincular pacote/i })).toBeInTheDocument();
    expect(screen.queryByText(/\/4/)).not.toBeInTheDocument();
  });

  it("com ciclo ativo, mostra o contador X/Y correto por tipo de sessão", async () => {
    vi.mocked(obterMembro).mockResolvedValue({
      id: "cliente-1",
      name: "Ana",
      email: "ana@x.com",
    } as never);
    vi.mocked(obterCicloAtivo).mockResolvedValue({
      id: "ciclo-1",
      nomePacote: "Projeto Corpo dos Sonhos",
      itens: [
        {
          tipoSessaoId: "ts1",
          tipoSessaoNome: "Aplicação",
          quantidadeContratada: 4,
          quantidadeRealizada: 2,
        },
        {
          tipoSessaoId: "ts2",
          tipoSessaoNome: "Radiofrequência",
          quantidadeContratada: 4,
          quantidadeRealizada: 4,
        },
      ],
      sessoes: [],
    } as never);
    vi.mocked(listarTiposPacote).mockResolvedValue([]);

    render(await MembroPacotePage({ params: buildParams("cliente-1") }));

    expect(screen.getByText("Aplicação: 2/4")).toBeInTheDocument();
    expect(screen.getByText("Radiofrequência: 4/4")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /marcar sessão/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /limite atingido/i })).toBeDisabled();
  });

  it("mostra o histórico de sessões com tipo e data para cada marcação", async () => {
    vi.mocked(obterMembro).mockResolvedValue({
      id: "cliente-1",
      name: "Ana",
      email: "ana@x.com",
    } as never);
    vi.mocked(obterCicloAtivo).mockResolvedValue(null);
    vi.mocked(listarTiposPacote).mockResolvedValue([]);
    vi.mocked(listarHistoricoCiclos).mockResolvedValue([
      {
        id: "ciclo-1",
        nomePacote: "Projeto Corpo dos Sonhos",
        ativo: true,
        sessoes: [
          { id: "sr1", tipoSessaoNome: "Aplicação", data: new Date("2026-09-01") },
          { id: "sr2", tipoSessaoNome: "Radiofrequência", data: new Date("2026-09-08") },
          { id: "sr3", tipoSessaoNome: "Ultrassom", data: new Date("2026-09-15") },
        ],
      },
    ] as never);

    render(await MembroPacotePage({ params: buildParams("cliente-1") }));

    const dataFormatada = /\d{2}\/\d{2}\/\d{4}/;
    expect(screen.getByText(new RegExp(`aplicação — ${dataFormatada.source}`, "i"))).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`radiofrequência — ${dataFormatada.source}`, "i")),
    ).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`ultrassom — ${dataFormatada.source}`, "i"))).toBeInTheDocument();
  });

  it("mostra as sessões de um ciclo arquivado e de um ciclo ativo, diferenciando cada um", async () => {
    vi.mocked(obterMembro).mockResolvedValue({
      id: "cliente-1",
      name: "Ana",
      email: "ana@x.com",
    } as never);
    vi.mocked(obterCicloAtivo).mockResolvedValue(null);
    vi.mocked(listarTiposPacote).mockResolvedValue([]);
    vi.mocked(listarHistoricoCiclos).mockResolvedValue([
      {
        id: "ciclo-2",
        nomePacote: "Pacote Novo",
        ativo: true,
        sessoes: [{ id: "sr2", tipoSessaoNome: "Aplicação", data: new Date("2026-09-10") }],
      },
      {
        id: "ciclo-1",
        nomePacote: "Pacote Antigo",
        ativo: false,
        sessoes: [{ id: "sr1", tipoSessaoNome: "Ultrassom", data: new Date("2026-08-01") }],
      },
    ] as never);

    render(await MembroPacotePage({ params: buildParams("cliente-1") }));

    const dataFormatada = /\d{2}\/\d{2}\/\d{4}/;
    expect(screen.getByText("Ciclo ativo")).toBeInTheDocument();
    expect(screen.getByText("Ciclo arquivado")).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`aplicação — ${dataFormatada.source}`, "i"))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`ultrassom — ${dataFormatada.source}`, "i"))).toBeInTheDocument();
  });

  describe("renovar pacote (com ciclo ativo)", () => {
    let confirmSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      vi.mocked(vincularPacote).mockReset();
      confirmSpy = vi.spyOn(window, "confirm");

      vi.mocked(obterMembro).mockResolvedValue({
        id: "cliente-1",
        name: "Ana",
        email: "ana@x.com",
      } as never);
      vi.mocked(obterCicloAtivo).mockResolvedValue({
        id: "ciclo-1",
        nomePacote: "Projeto Corpo dos Sonhos",
        itens: [
          {
            tipoSessaoId: "ts1",
            tipoSessaoNome: "Aplicação",
            quantidadeContratada: 4,
            quantidadeRealizada: 3,
          },
        ],
        sessoes: [],
      } as never);
      vi.mocked(listarTiposPacote).mockResolvedValue([
        { id: "tp1", nome: "Projeto Corpo dos Sonhos", ativo: true, criadoEm: new Date(), itens: [] },
      ] as never);
    });

    it("mostra o gatilho 'Renovar pacote' alcançável na tela quando já há ciclo ativo", async () => {
      render(await MembroPacotePage({ params: buildParams("cliente-1") }));

      expect(screen.getByRole("button", { name: /renovar pacote/i })).toBeInTheDocument();
    });

    it("ao confirmar, abre a confirmação mostrando o contador do ciclo atual e chama vincularPacote", async () => {
      confirmSpy.mockReturnValue(true);
      vi.mocked(vincularPacote).mockResolvedValue(undefined);

      render(await MembroPacotePage({ params: buildParams("cliente-1") }));

      fireEvent.change(screen.getByLabelText(/tipo de pacote/i), {
        target: { value: "tp1" },
      });
      fireEvent.click(screen.getByRole("button", { name: /renovar pacote/i }));

      expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining("Aplicação 3/4"));
      await waitFor(() =>
        expect(vincularPacote).toHaveBeenCalledWith("cliente-1", "tp1"),
      );
    });

    it("ao cancelar a confirmação, não chama vincularPacote", async () => {
      confirmSpy.mockReturnValue(false);

      render(await MembroPacotePage({ params: buildParams("cliente-1") }));

      fireEvent.change(screen.getByLabelText(/tipo de pacote/i), {
        target: { value: "tp1" },
      });
      fireEvent.click(screen.getByRole("button", { name: /renovar pacote/i }));

      expect(confirmSpy).toHaveBeenCalled();
      expect(vincularPacote).not.toHaveBeenCalled();
    });
  });
});
