// @vitest-environment jsdom
vi.mock("@/lib/auth/requerer-acesso-painel", () => ({
  requererAcessoPainelOuRedirecionar: vi.fn(),
}));

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import PacotesPage from "./page";
import { listarTiposSessao, listarTiposPacote } from "./queries";
import {
  criarTipoSessao,
  criarTipoPacote,
  editarTipoSessao,
  excluirTipoSessao,
  reativarTipoSessao,
  editarTipoPacote,
  excluirTipoPacote,
  reativarTipoPacote,
} from "./actions";

vi.mock("./queries", () => ({
  listarTiposSessao: vi.fn(),
  listarTiposPacote: vi.fn(),
}));

vi.mock("./actions", () => ({
  criarTipoSessao: vi.fn(),
  criarTipoPacote: vi.fn(),
  editarTipoSessao: vi.fn(),
  excluirTipoSessao: vi.fn(),
  reativarTipoSessao: vi.fn(),
  editarTipoPacote: vi.fn(),
  excluirTipoPacote: vi.fn(),
  reativarTipoPacote: vi.fn(),
}));

describe("PacotesPage", () => {
  beforeEach(() => {
    vi.mocked(criarTipoSessao).mockReset();
    vi.mocked(criarTipoPacote).mockReset();
    vi.mocked(editarTipoSessao).mockReset();
    vi.mocked(excluirTipoSessao).mockReset();
    vi.mocked(reativarTipoSessao).mockReset();
    vi.mocked(editarTipoPacote).mockReset();
    vi.mocked(excluirTipoPacote).mockReset();
    vi.mocked(reativarTipoPacote).mockReset();
  });

  it("mostra o tipo de pacote cadastrado com nome e composição corretos", async () => {
    vi.mocked(listarTiposSessao).mockResolvedValue([
      { id: "ts1", nome: "Aplicação", ativo: true, criadoEm: new Date() },
      { id: "ts2", nome: "Radiofrequência", ativo: true, criadoEm: new Date() },
      { id: "ts3", nome: "Ultrassom", ativo: true, criadoEm: new Date() },
    ] as never);
    vi.mocked(listarTiposPacote).mockResolvedValue([
      {
        id: "tp1",
        nome: "Projeto Corpo dos Sonhos",
        ativo: true,
        criadoEm: new Date(),
        itens: [
          { id: "i1", quantidade: 4, tipoSessao: { id: "ts1", nome: "Aplicação" } },
          { id: "i2", quantidade: 4, tipoSessao: { id: "ts2", nome: "Radiofrequência" } },
          { id: "i3", quantidade: 4, tipoSessao: { id: "ts3", nome: "Ultrassom" } },
        ],
      },
    ] as never);

    render(await PacotesPage());

    expect(screen.getByText("Projeto Corpo dos Sonhos")).toBeInTheDocument();
    expect(screen.getByText("Aplicação: 4")).toBeInTheDocument();
    expect(screen.getByText("Radiofrequência: 4")).toBeInTheDocument();
    expect(screen.getByText("Ultrassom: 4")).toBeInTheDocument();
  });

  it("mostra a mensagem de lista vazia quando não há nenhum tipo de pacote", async () => {
    vi.mocked(listarTiposSessao).mockResolvedValue([]);
    vi.mocked(listarTiposPacote).mockResolvedValue([]);

    render(await PacotesPage());

    expect(screen.getByText(/nenhum tipo de pacote cadastrado ainda/i)).toBeInTheDocument();
  });

  it("mostra a mensagem de erro quando salvar sem nenhum tipo de sessão informado falha", async () => {
    vi.mocked(listarTiposSessao).mockResolvedValue([
      { id: "ts1", nome: "Aplicação", ativo: true, criadoEm: new Date() },
    ] as never);
    vi.mocked(listarTiposPacote).mockResolvedValue([]);
    vi.mocked(criarTipoPacote).mockRejectedValue(
      new Error("Selecione ao menos um tipo de sessão com quantidade"),
    );

    render(await PacotesPage());

    fireEvent.submit(screen.getByRole("form", { name: /criar tipo de pacote/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Selecione ao menos um tipo de sessão com quantidade",
      ),
    );
    expect(criarTipoPacote).toHaveBeenCalledTimes(1);
  });

  describe("editar, excluir e reativar tipo de sessão", () => {
    beforeEach(() => {
      vi.mocked(listarTiposPacote).mockResolvedValue([]);
    });

    it("um tipo de sessão arquivado mostra 'Arquivado' e o botão Reativar, não Excluir", async () => {
      vi.mocked(listarTiposSessao).mockResolvedValue([
        { id: "ts1", nome: "Aplicação", ativo: false, criadoEm: new Date() },
      ] as never);

      render(await PacotesPage());

      expect(screen.getByText("Arquivado")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /reativar tipo de sessão/i })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /excluir tipo de sessão/i })).not.toBeInTheDocument();
    });

    it("clicar em Editar troca pra um formulário e salvar chama editarTipoSessao", async () => {
      vi.mocked(listarTiposSessao).mockResolvedValue([
        { id: "ts1", nome: "Aplicação", ativo: true, criadoEm: new Date() },
      ] as never);
      vi.mocked(editarTipoSessao).mockResolvedValue(undefined);

      render(await PacotesPage());

      fireEvent.click(screen.getByRole("button", { name: /editar tipo de sessão/i }));
      const campoNome = screen.getByDisplayValue("Aplicação");
      fireEvent.change(campoNome, { target: { value: "Aplicação de Ácido" } });
      fireEvent.submit(screen.getByRole("form", { name: /editar tipo de sessão/i }));

      await waitFor(() => expect(editarTipoSessao).toHaveBeenCalledTimes(1));
      const formDataEnviado = vi.mocked(editarTipoSessao).mock.calls[0]?.[0] as FormData;
      expect(formDataEnviado.get("id")).toBe("ts1");
      expect(formDataEnviado.get("nome")).toBe("Aplicação de Ácido");
    });

    it("clicar em Excluir (confirmando) chama excluirTipoSessao com o id", async () => {
      const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
      vi.mocked(listarTiposSessao).mockResolvedValue([
        { id: "ts1", nome: "Aplicação", ativo: true, criadoEm: new Date() },
      ] as never);
      vi.mocked(excluirTipoSessao).mockResolvedValue(undefined);

      render(await PacotesPage());

      fireEvent.click(screen.getByRole("button", { name: /excluir tipo de sessão/i }));

      expect(confirmSpy).toHaveBeenCalled();
      await waitFor(() => expect(excluirTipoSessao).toHaveBeenCalledWith("ts1"));
    });

    it("clicar em Reativar chama reativarTipoSessao com o id", async () => {
      vi.mocked(listarTiposSessao).mockResolvedValue([
        { id: "ts1", nome: "Aplicação", ativo: false, criadoEm: new Date() },
      ] as never);
      vi.mocked(reativarTipoSessao).mockResolvedValue(undefined);

      render(await PacotesPage());

      fireEvent.click(screen.getByRole("button", { name: /reativar tipo de sessão/i }));

      await waitFor(() => expect(reativarTipoSessao).toHaveBeenCalledWith("ts1"));
    });
  });

  describe("editar, excluir e reativar tipo de pacote", () => {
    const tiposSessaoBase = [
      { id: "ts1", nome: "Aplicação", ativo: true, criadoEm: new Date() },
    ];

    it("um tipo de pacote arquivado mostra 'Arquivado' e o botão Reativar, não Excluir", async () => {
      vi.mocked(listarTiposSessao).mockResolvedValue(tiposSessaoBase as never);
      vi.mocked(listarTiposPacote).mockResolvedValue([
        {
          id: "tp1",
          nome: "Pacote Antigo",
          ativo: false,
          criadoEm: new Date(),
          itens: [{ id: "i1", tipoSessaoId: "ts1", quantidade: 4, tipoSessao: { nome: "Aplicação" } }],
        },
      ] as never);

      render(await PacotesPage());

      expect(screen.getByText("Arquivado")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /reativar tipo de pacote/i })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /excluir tipo de pacote/i })).not.toBeInTheDocument();
    });

    it("clicar em Editar troca pra um formulário com os valores atuais e salvar chama editarTipoPacote", async () => {
      vi.mocked(listarTiposSessao).mockResolvedValue(tiposSessaoBase as never);
      vi.mocked(listarTiposPacote).mockResolvedValue([
        {
          id: "tp1",
          nome: "Projeto Corpo dos Sonhos",
          ativo: true,
          criadoEm: new Date(),
          itens: [{ id: "i1", tipoSessaoId: "ts1", quantidade: 4, tipoSessao: { nome: "Aplicação" } }],
        },
      ] as never);
      vi.mocked(editarTipoPacote).mockResolvedValue(undefined);

      render(await PacotesPage());

      fireEvent.click(screen.getByRole("button", { name: /editar tipo de pacote/i }));

      expect(screen.getByDisplayValue("Projeto Corpo dos Sonhos")).toBeInTheDocument();
      expect(screen.getByDisplayValue("4")).toBeInTheDocument();

      fireEvent.change(screen.getByDisplayValue("Projeto Corpo dos Sonhos"), {
        target: { value: "Projeto Corpo dos Sonhos 2" },
      });
      fireEvent.submit(screen.getByRole("form", { name: /editar tipo de pacote/i }));

      await waitFor(() => expect(editarTipoPacote).toHaveBeenCalledTimes(1));
      const formDataEnviado = vi.mocked(editarTipoPacote).mock.calls[0]?.[0] as FormData;
      expect(formDataEnviado.get("id")).toBe("tp1");
      expect(formDataEnviado.get("nome")).toBe("Projeto Corpo dos Sonhos 2");
      expect(formDataEnviado.get("quantidade-ts1")).toBe("4");
    });

    it("clicar em Excluir (confirmando) chama excluirTipoPacote com o id", async () => {
      const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
      vi.mocked(listarTiposSessao).mockResolvedValue(tiposSessaoBase as never);
      vi.mocked(listarTiposPacote).mockResolvedValue([
        {
          id: "tp1",
          nome: "Projeto Corpo dos Sonhos",
          ativo: true,
          criadoEm: new Date(),
          itens: [{ id: "i1", tipoSessaoId: "ts1", quantidade: 4, tipoSessao: { nome: "Aplicação" } }],
        },
      ] as never);
      vi.mocked(excluirTipoPacote).mockResolvedValue(undefined);

      render(await PacotesPage());

      fireEvent.click(screen.getByRole("button", { name: /excluir tipo de pacote/i }));

      expect(confirmSpy).toHaveBeenCalled();
      await waitFor(() => expect(excluirTipoPacote).toHaveBeenCalledWith("tp1"));
    });

    it("clicar em Reativar chama reativarTipoPacote com o id", async () => {
      vi.mocked(listarTiposSessao).mockResolvedValue(tiposSessaoBase as never);
      vi.mocked(listarTiposPacote).mockResolvedValue([
        {
          id: "tp1",
          nome: "Pacote Antigo",
          ativo: false,
          criadoEm: new Date(),
          itens: [{ id: "i1", tipoSessaoId: "ts1", quantidade: 4, tipoSessao: { nome: "Aplicação" } }],
        },
      ] as never);
      vi.mocked(reativarTipoPacote).mockResolvedValue(undefined);

      render(await PacotesPage());

      fireEvent.click(screen.getByRole("button", { name: /reativar tipo de pacote/i }));

      await waitFor(() => expect(reativarTipoPacote).toHaveBeenCalledWith("tp1"));
    });

    it("editar um pacote com tipo de sessão arquivado continua mostrando esse tipo na edição (não some em silêncio)", async () => {
      vi.mocked(listarTiposSessao).mockResolvedValue([
        { id: "ts1", nome: "Aplicação", ativo: true, criadoEm: new Date() },
        { id: "ts2", nome: "Antigo Descontinuado", ativo: false, criadoEm: new Date() },
      ] as never);
      vi.mocked(listarTiposPacote).mockResolvedValue([
        {
          id: "tp1",
          nome: "Projeto Corpo dos Sonhos",
          ativo: true,
          criadoEm: new Date(),
          itens: [
            { id: "i1", tipoSessaoId: "ts1", quantidade: 4, tipoSessao: { nome: "Aplicação" } },
            {
              id: "i2",
              tipoSessaoId: "ts2",
              quantidade: 2,
              tipoSessao: { nome: "Antigo Descontinuado" },
            },
          ],
        },
      ] as never);

      render(await PacotesPage());

      fireEvent.click(screen.getByRole("button", { name: /editar tipo de pacote/i }));

      const formularioEdicao = screen.getByRole("form", { name: /editar tipo de pacote/i });
      expect(within(formularioEdicao).getByText(/antigo descontinuado \(arquivado\)/i)).toBeInTheDocument();
      expect(within(formularioEdicao).getByLabelText(/antigo descontinuado/i)).toHaveValue(2);
    });
  });
});
