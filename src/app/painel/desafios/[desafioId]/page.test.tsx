// @vitest-environment jsdom
vi.mock("@/lib/auth/requerer-acesso-painel", () => ({
  requererAcessoPainelOuRedirecionar: vi.fn(),
}));

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import DesafioDetalhePage from "./page";
import { obterDesafioComCategorias } from "./queries";
import { listarEmblemas } from "../emblemas/queries";
import { criarCategoria, alternarExigeFoto } from "./actions";

vi.mock("./queries", () => ({
  obterDesafioComCategorias: vi.fn(),
}));

vi.mock("../emblemas/queries", () => ({
  listarEmblemas: vi.fn(),
}));

vi.mock("./actions", () => ({
  criarCategoria: vi.fn(),
  removerCategoria: vi.fn(),
  criarItem: vi.fn(),
  removerItem: vi.fn(),
  alternarExigeFoto: vi.fn(),
  criarRegraLimiar: vi.fn(),
  criarRegraCombo: vi.fn(),
  criarRegraCategoriaCompleta: vi.fn(),
  removerRegraBonus: vi.fn(),
  criarDesafioSurpresa: vi.fn(),
  removerDesafioSurpresa: vi.fn(),
  aprovarParticipacao: vi.fn(),
  rejeitarParticipacao: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

describe("DesafioDetalhePage", () => {
  beforeEach(() => {
    vi.mocked(listarEmblemas).mockResolvedValue([]);
  });

  it("chama notFound quando o desafio não existe", async () => {
    vi.mocked(obterDesafioComCategorias).mockResolvedValue(null);

    await expect(
      DesafioDetalhePage({ params: Promise.resolve({ desafioId: "d1" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renderiza o título, o formulário de categoria e as mensagens de lista vazia", async () => {
    vi.mocked(obterDesafioComCategorias).mockResolvedValue({
      id: "d1",
      titulo: "Glow Up",
      ativo: true,
      categorias: [],
      regrasBonus: [],
      desafiosSurpresa: [],
    } as never);

    render(await DesafioDetalhePage({ params: Promise.resolve({ desafioId: "d1" }) }));

    expect(screen.getByText("Glow Up")).toBeInTheDocument();
    expect(
      screen.getByRole("form", { name: /criar categoria/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/nenhuma categoria ainda/i)).toBeInTheDocument();
    expect(screen.getByText(/nenhum desafio surpresa criado ainda/i)).toBeInTheDocument();
  });

  it("renderiza categoria com seus itens e o form de novo item", async () => {
    vi.mocked(obterDesafioComCategorias).mockResolvedValue({
      id: "d1",
      titulo: "Glow Up",
      ativo: true,
      categorias: [
        {
          id: "c1",
          nome: "Pele",
          cor: "#f5c",
          itens: [
            {
              id: "i1",
              descricao: "Hidratar",
              pontos: 5,
              frequencia: "DIARIO",
              exigeFoto: false,
            },
          ],
        },
      ],
      regrasBonus: [],
      desafiosSurpresa: [],
    } as never);

    render(await DesafioDetalhePage({ params: Promise.resolve({ desafioId: "d1" }) }));

    const itemRow = screen.getByRole("listitem");
    expect(within(itemRow).getByText("Hidratar")).toBeInTheDocument();
    expect(within(itemRow).getByText("5 pts")).toBeInTheDocument();
    expect(within(itemRow).getByText("Diário")).toBeInTheDocument();
    expect(within(itemRow).queryByText("Exige foto")).not.toBeInTheDocument();
    expect(
      screen.getByRole("form", { name: /criar item em pele/i }),
    ).toBeInTheDocument();
  });

  it("mostra o indicador 'Exige foto' só no item marcado, e alternar chama a action", async () => {
    vi.mocked(obterDesafioComCategorias).mockResolvedValue({
      id: "d1",
      titulo: "Glow Up",
      ativo: true,
      categorias: [
        {
          id: "c1",
          nome: "Pele",
          cor: "#f5c",
          itens: [
            {
              id: "i1",
              descricao: "Ida à academia",
              pontos: 10,
              frequencia: "DIARIO",
              exigeFoto: true,
            },
            {
              id: "i2",
              descricao: "Hidratar",
              pontos: 5,
              frequencia: "DIARIO",
              exigeFoto: false,
            },
          ],
        },
      ],
      regrasBonus: [],
      desafiosSurpresa: [],
    } as never);
    vi.mocked(alternarExigeFoto).mockResolvedValue(undefined);

    render(await DesafioDetalhePage({ params: Promise.resolve({ desafioId: "d1" }) }));

    const itens = screen.getAllByRole("listitem");
    expect(within(itens[0]).getByText("Exige foto")).toBeInTheDocument();
    expect(within(itens[1]).queryByText("Exige foto")).not.toBeInTheDocument();

    fireEvent.click(within(itens[1]).getByRole("button", { name: /exigir foto/i }));

    await waitFor(() => expect(alternarExigeFoto).toHaveBeenCalledWith("i2"));
  });

  it("renderiza os três formulários de nova regra de bônus", async () => {
    vi.mocked(obterDesafioComCategorias).mockResolvedValue({
      id: "d1",
      titulo: "Glow Up",
      ativo: true,
      categorias: [],
      regrasBonus: [],
      desafiosSurpresa: [],
    } as never);

    render(await DesafioDetalhePage({ params: Promise.resolve({ desafioId: "d1" }) }));

    expect(
      screen.getByRole("form", { name: /criar regra de limiar diário/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("form", { name: /criar regra de combo/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("form", { name: /criar regra de categoria completa/i }),
    ).toBeInTheDocument();
  });

  it("lista o catálogo de emblemas no seletor de cada formulário de regra de bônus", async () => {
    vi.mocked(obterDesafioComCategorias).mockResolvedValue({
      id: "d1",
      titulo: "Glow Up",
      ativo: true,
      categorias: [],
      regrasBonus: [],
      desafiosSurpresa: [],
    } as never);
    vi.mocked(listarEmblemas).mockResolvedValue([
      { id: "e1", nome: "Disciplina" },
    ] as never);

    render(await DesafioDetalhePage({ params: Promise.resolve({ desafioId: "d1" }) }));

    expect(screen.getAllByRole("option", { name: "Disciplina" })).toHaveLength(3);
  });

  it("renderiza cada tipo de regra de bônus com a descrição certa", async () => {
    vi.mocked(obterDesafioComCategorias).mockResolvedValue({
      id: "d1",
      titulo: "Glow Up",
      ativo: true,
      categorias: [{ id: "c1", nome: "Pele", cor: "#f5c", itens: [] }],
      regrasBonus: [
        {
          id: "r1",
          tipo: "LIMIAR_DIARIO",
          pontosExtras: 10,
          limiarItens: 4,
          itensCombo: [],
          categoriaId: null,
        },
        {
          id: "r2",
          tipo: "COMBO",
          pontosExtras: 15,
          limiarItens: null,
          itensCombo: [
            { id: "i1", descricao: "Água" },
            { id: "i2", descricao: "Academia" },
          ],
          categoriaId: null,
        },
        {
          id: "r3",
          tipo: "CATEGORIA_COMPLETA",
          pontosExtras: 20,
          limiarItens: null,
          itensCombo: [],
          categoriaId: "c1",
        },
      ],
      desafiosSurpresa: [],
    } as never);

    render(await DesafioDetalhePage({ params: Promise.resolve({ desafioId: "d1" }) }));

    expect(screen.getByText(/completar 4 itens no dia/i)).toBeInTheDocument();
    expect(screen.getByText(/água \+ academia/i)).toBeInTheDocument();
    expect(screen.getByText(/completar a categoria "pele"/i)).toBeInTheDocument();
  });

  it("renderiza participações de desafio surpresa como histórico somente leitura, sem botões de decisão", async () => {
    vi.mocked(obterDesafioComCategorias).mockResolvedValue({
      id: "d1",
      titulo: "Glow Up",
      ativo: true,
      categorias: [],
      regrasBonus: [],
      desafiosSurpresa: [
        {
          id: "s1",
          titulo: "Corrida 5km",
          descricao: "Manda o print",
          pontos: 50,
          exigeComprovacao: true,
          participacoes: [
            {
              id: "p1",
              cliente: { id: "c1", name: "Cliente 1", email: "c1@x.com" },
              validado: false,
              fotoUrl: "https://url-assinada.exemplo/comprovante-1.webp",
            },
            {
              id: "p2",
              cliente: { id: "c2", name: "Cliente 2", email: "c2@x.com" },
              validado: true,
              fotoUrl: null,
            },
          ],
        },
      ],
    } as never);

    render(await DesafioDetalhePage({ params: Promise.resolve({ desafioId: "d1" }) }));

    expect(screen.getByText("Corrida 5km")).toBeInTheDocument();
    expect(screen.getByText("Cliente 1")).toBeInTheDocument();
    expect(screen.getByText("Cliente 2")).toBeInTheDocument();
    expect(screen.getByText("Pendente")).toBeInTheDocument();
    expect(screen.getByText("Aprovada")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^aprovar$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^rejeitar$/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/decisão pendente em \/painel\/aprovacoes/i)).toBeInTheDocument();
    expect(
      screen.getByAltText("Comprovação enviada pela cliente"),
    ).toBeInTheDocument();
  });

  it("mostra a mensagem de erro original quando criar categoria falha", async () => {
    vi.mocked(obterDesafioComCategorias).mockResolvedValue({
      id: "d1",
      titulo: "Glow Up",
      ativo: true,
      categorias: [],
      regrasBonus: [],
      desafiosSurpresa: [],
    } as never);
    vi.mocked(criarCategoria).mockRejectedValue(
      new Error("Informe o nome da categoria"),
    );

    render(await DesafioDetalhePage({ params: Promise.resolve({ desafioId: "d1" }) }));

    fireEvent.submit(screen.getByRole("form", { name: /criar categoria/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Informe o nome da categoria",
      ),
    );
  });

});
