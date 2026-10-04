// @vitest-environment jsdom
vi.mock("@/lib/auth/requerer-acesso-painel", () => ({
  requererAcessoPainelOuRedirecionar: vi.fn(),
}));

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AprovacoesPage from "./page";
import { listarPendentes, listarComprovacoesPendentes } from "./queries";
import { aprovarConta, rejeitarConta, aprovarMarcacaoItem, rejeitarMarcacaoItem } from "./actions";
import { aprovarParticipacao, rejeitarParticipacao } from "../desafios/[desafioId]/actions";

vi.mock("./queries", () => ({
  listarPendentes: vi.fn(),
  listarComprovacoesPendentes: vi.fn(),
}));

vi.mock("./actions", () => ({
  aprovarConta: vi.fn(),
  rejeitarConta: vi.fn(),
  aprovarMarcacaoItem: vi.fn(),
  rejeitarMarcacaoItem: vi.fn(),
}));

vi.mock("../desafios/[desafioId]/actions", () => ({
  aprovarParticipacao: vi.fn(),
  rejeitarParticipacao: vi.fn(),
}));

const SEM_PENDENCIAS = { itens: [], participacoesSurpresa: [] };

describe("AprovacoesPage", () => {
  beforeEach(() => {
    vi.mocked(listarPendentes).mockReset();
    vi.mocked(listarComprovacoesPendentes).mockReset();
    vi.mocked(listarComprovacoesPendentes).mockResolvedValue(SEM_PENDENCIAS as never);
    vi.mocked(aprovarConta).mockReset();
    vi.mocked(rejeitarConta).mockReset();
    vi.mocked(aprovarMarcacaoItem).mockReset();
    vi.mocked(rejeitarMarcacaoItem).mockReset();
    vi.mocked(aprovarParticipacao).mockReset();
    vi.mocked(rejeitarParticipacao).mockReset();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("mostra a mensagem de vazio quando não há nenhuma pendência (contas, itens ou surpresa)", async () => {
    vi.mocked(listarPendentes).mockResolvedValue([]);

    render(await AprovacoesPage());

    expect(screen.getByText(/nenhum pedido pendente/i)).toBeInTheDocument();
  });

  it("aprova a conta ao clicar em Aprovar", async () => {
    vi.mocked(listarPendentes).mockResolvedValue([
      { id: "user-1", name: "Fulana", email: "fulana@x.com" } as never,
    ]);
    vi.mocked(aprovarConta).mockResolvedValue(undefined);

    render(await AprovacoesPage());

    fireEvent.click(screen.getByRole("button", { name: /aprovar/i }));

    await waitFor(() => expect(aprovarConta).toHaveBeenCalledWith("user-1"));
  });

  it("mostra a mensagem de erro original quando aprovar falha", async () => {
    vi.mocked(listarPendentes).mockResolvedValue([
      { id: "user-1", name: "Fulana", email: "fulana@x.com" } as never,
    ]);
    vi.mocked(aprovarConta).mockRejectedValue(new Error("Acesso negado"));

    render(await AprovacoesPage());

    fireEvent.click(screen.getByRole("button", { name: /aprovar/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Acesso negado"),
    );
  });

  it("pede confirmação e rejeita a conta ao clicar em Rejeitar", async () => {
    vi.mocked(listarPendentes).mockResolvedValue([
      { id: "user-1", name: "Fulana", email: "fulana@x.com" } as never,
    ]);
    vi.mocked(rejeitarConta).mockResolvedValue(undefined);

    render(await AprovacoesPage());

    fireEvent.click(screen.getByRole("button", { name: /rejeitar/i }));

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => expect(rejeitarConta).toHaveBeenCalledWith("user-1"));
  });

  it("renderiza comprovações de item e participações de desafio surpresa pendentes juntas", async () => {
    vi.mocked(listarPendentes).mockResolvedValue([]);
    vi.mocked(listarComprovacoesPendentes).mockResolvedValue({
      itens: [
        {
          id: "m1",
          fotoUrl: "https://url-item.exemplo",
          item: {
            descricao: "Ida à academia",
            pontos: 10,
            categoria: { desafio: { titulo: "Glow Up" } },
          },
          cliente: { id: "cliente-1", name: "Cliente 1", email: "c1@x.com" },
        },
      ],
      participacoesSurpresa: [
        {
          id: "p1",
          fotoUrl: "https://url-surpresa.exemplo",
          desafioSurpresa: { titulo: "Corrida 5km", pontos: 50 },
          cliente: { id: "cliente-2", name: "Cliente 2", email: "c2@x.com" },
        },
      ],
    } as never);

    render(await AprovacoesPage());

    expect(screen.getByText("Cliente 1")).toBeInTheDocument();
    expect(screen.getByText(/ida à academia/i)).toBeInTheDocument();
    expect(screen.getByText("Cliente 2")).toBeInTheDocument();
    expect(screen.getByText(/corrida 5km/i)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^aprovar$/i })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /^rejeitar$/i })).toHaveLength(2);
  });

  it("aprova a comprovação de item ao clicar em Aprovar na seção de itens", async () => {
    vi.mocked(listarPendentes).mockResolvedValue([]);
    vi.mocked(listarComprovacoesPendentes).mockResolvedValue({
      itens: [
        {
          id: "m1",
          fotoUrl: null,
          item: {
            descricao: "Ida à academia",
            pontos: 10,
            categoria: { desafio: { titulo: "Glow Up" } },
          },
          cliente: { id: "cliente-1", name: "Cliente 1", email: "c1@x.com" },
        },
      ],
      participacoesSurpresa: [],
    } as never);
    vi.mocked(aprovarMarcacaoItem).mockResolvedValue(undefined);

    render(await AprovacoesPage());

    fireEvent.click(screen.getByRole("button", { name: /^aprovar$/i }));

    await waitFor(() => expect(aprovarMarcacaoItem).toHaveBeenCalledWith("m1"));
  });

  it("rejeita a comprovação de item ao clicar em Rejeitar na seção de itens", async () => {
    vi.mocked(listarPendentes).mockResolvedValue([]);
    vi.mocked(listarComprovacoesPendentes).mockResolvedValue({
      itens: [
        {
          id: "m1",
          fotoUrl: null,
          item: {
            descricao: "Ida à academia",
            pontos: 10,
            categoria: { desafio: { titulo: "Glow Up" } },
          },
          cliente: { id: "cliente-1", name: "Cliente 1", email: "c1@x.com" },
        },
      ],
      participacoesSurpresa: [],
    } as never);
    vi.mocked(rejeitarMarcacaoItem).mockResolvedValue(undefined);

    render(await AprovacoesPage());

    fireEvent.click(screen.getByRole("button", { name: /^rejeitar$/i }));

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => expect(rejeitarMarcacaoItem).toHaveBeenCalledWith("m1"));
  });

  it("aprova/rejeita a participação de desafio surpresa a partir desta tela", async () => {
    vi.mocked(listarPendentes).mockResolvedValue([]);
    vi.mocked(listarComprovacoesPendentes).mockResolvedValue({
      itens: [],
      participacoesSurpresa: [
        {
          id: "p1",
          fotoUrl: null,
          desafioSurpresa: { titulo: "Corrida 5km", pontos: 50 },
          cliente: { id: "cliente-2", name: "Cliente 2", email: "c2@x.com" },
        },
      ],
    } as never);
    vi.mocked(aprovarParticipacao).mockResolvedValue(undefined);

    render(await AprovacoesPage());

    fireEvent.click(screen.getByRole("button", { name: /^aprovar$/i }));

    await waitFor(() => expect(aprovarParticipacao).toHaveBeenCalledWith("p1"));
  });
});
