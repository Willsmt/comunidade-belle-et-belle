import { beforeEach, describe, expect, it, vi } from "vitest";

// Leituras do painel checam o acesso elas mesmas (layout e middleware não são
// barreira de segurança): CLIENTE é barrada antes de qualquer consulta ao
// banco; GESTORA e ADMIN passam.

const { mockAuth, mockConsulta } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockConsulta: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("next/navigation", () => ({
  redirect: (destino: string) => {
    throw new Error(`NEXT_REDIRECT:${destino}`);
  },
}));
// Qualquer model/método do Prisma cai no mesmo spy
vi.mock("@/lib/prisma", () => ({
  prisma: new Proxy(
    {},
    {
      get: () =>
        new Proxy(
          {},
          {
            get:
              (_alvo, metodo) =>
              (...args: unknown[]) => {
                mockConsulta(metodo, ...args);
                return Promise.resolve(
                  metodo === "findMany" ? [] : metodo === "count" ? 0 : null,
                );
              },
          },
        ),
    },
  ),
}));
vi.mock("@/lib/storage/comprovantes-item-desafio", () => ({
  gerarUrlAssinada: vi.fn(),
}));
vi.mock("@/lib/storage/comprovantes-surpresa", () => ({
  gerarUrlAssinada: vi.fn(),
}));

import * as aprovacoes from "./aprovacoes/queries";
import * as desafios from "./desafios/queries";
import * as detalheDesafio from "./desafios/[desafioId]/queries";
import * as emblemas from "./desafios/emblemas/queries";
import * as membros from "./membros/queries";
import * as detalheMembro from "./membros/[membroId]/queries";
import * as pacotes from "./pacotes/queries";
import * as vinculos from "./vinculos/queries";

const LEITURAS: [string, () => Promise<unknown>][] = [
  ["aprovacoes.listarPendentes", () => aprovacoes.listarPendentes()],
  ["aprovacoes.listarComprovacoesPendentes", () => aprovacoes.listarComprovacoesPendentes()],
  ["desafios.listarDesafios", () => desafios.listarDesafios()],
  ["desafios/[id].obterDesafioComCategorias", () => detalheDesafio.obterDesafioComCategorias("d1")],
  ["emblemas.listarEmblemas", () => emblemas.listarEmblemas()],
  ["membros.listarMembros", () => membros.listarMembros()],
  ["membros.contarAdminsGestorasAtivos", () => membros.contarAdminsGestorasAtivos()],
  ["membros/[id].obterMembro", () => detalheMembro.obterMembro("m1")],
  ["membros/[id].obterCicloAtivo", () => detalheMembro.obterCicloAtivo("m1")],
  ["membros/[id].listarHistoricoCiclos", () => detalheMembro.listarHistoricoCiclos("m1")],
  ["pacotes.listarTiposSessao", () => pacotes.listarTiposSessao()],
  ["pacotes.listarTiposPacote", () => pacotes.listarTiposPacote()],
  ["vinculos.listarVinculos", () => vinculos.listarVinculos()],
  ["vinculos.listarClientesEParcerias", () => vinculos.listarClientesEParcerias()],
];

const sessao = (papeis: string[], status = "ATIVO") => ({
  user: { id: "u1", status, papeis },
});

describe.each(LEITURAS)("%s", (_nome, ler) => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockConsulta.mockReset();
  });

  it.each([
    ["sem sessão", null],
    ["CLIENTE", sessao(["CLIENTE"])],
    ["PARCERIA", sessao(["PARCERIA"])],
    ["GESTORA PENDENTE", sessao(["GESTORA"], "PENDENTE")],
    ["ADMIN SUSPENSO", sessao(["ADMIN"], "SUSPENSO")],
  ])("barra %s antes de consultar o banco", async (_quem, s) => {
    mockAuth.mockResolvedValue(s);
    await expect(ler()).rejects.toThrow("NEXT_REDIRECT:/");
    expect(mockConsulta).not.toHaveBeenCalled();
  });

  it.each(["GESTORA", "ADMIN"])("deixa %s ativa consultar", async (papel) => {
    mockAuth.mockResolvedValue(sessao([papel]));
    await ler();
    expect(mockConsulta).toHaveBeenCalled();
  });
});
