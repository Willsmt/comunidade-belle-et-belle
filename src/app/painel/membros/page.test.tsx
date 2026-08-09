// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import MembrosPage from "./page";
import { contarAdminsGestorasAtivos, listarMembros } from "./queries";
import { promoverAParceria, revogarParceria } from "./actions";
import { auth } from "@/auth";
import type { Papel, StatusConta } from "@/generated/prisma/client";

vi.mock("./queries", () => ({
  listarMembros: vi.fn(),
  contarAdminsGestorasAtivos: vi.fn(),
}));

vi.mock("./actions", () => ({
  suspenderMembro: vi.fn(),
  reativarMembro: vi.fn(),
  deletarMembro: vi.fn(),
  promoverAParceria: vi.fn(),
  revogarParceria: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

function buildMembro(
  overrides: {
    status?: StatusConta;
    papeis?: { papel: Papel }[];
    vinculosAtivos?: number;
  } = {},
) {
  const { vinculosAtivos = 0, ...resto } = overrides;
  return {
    id: "membro-1",
    name: "Fulana",
    email: "fulana@x.com",
    image: null,
    status: "ATIVO" as StatusConta,
    papeis: [] as { papel: Papel }[],
    _count: { vinculosComoParceria: vinculosAtivos },
    ...resto,
  };
}

describe("MembrosPage", () => {
  beforeEach(() => {
    vi.mocked(listarMembros).mockReset();
    vi.mocked(promoverAParceria).mockReset();
    vi.mocked(revogarParceria).mockReset();
    vi.mocked(contarAdminsGestorasAtivos).mockReset();
    vi.mocked(auth).mockReset();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    vi.mocked(contarAdminsGestorasAtivos).mockResolvedValue(2);
    vi.mocked(auth).mockResolvedValue({
      user: { id: "quem-esta-logada" },
    } as unknown as Awaited<ReturnType<typeof auth>>);
  });

  it("mostra 'Promover a Parceria' pra quem ainda não tem o papel", async () => {
    vi.mocked(listarMembros).mockResolvedValue([buildMembro()]);

    render(await MembrosPage());

    expect(
      screen.getByRole("button", { name: /promover a parceria/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /revogar parceria/i }),
    ).not.toBeInTheDocument();
  });

  it("mostra 'Revogar Parceria' pra quem já é PARCERIA", async () => {
    vi.mocked(listarMembros).mockResolvedValue([
      buildMembro({ papeis: [{ papel: "PARCERIA" }] }),
    ]);

    render(await MembrosPage());

    expect(
      screen.getByRole("button", { name: /revogar parceria/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /promover a parceria/i }),
    ).not.toBeInTheDocument();
  });

  it("sem vínculos ativos: aviso genérico, sem menção a vínculos", async () => {
    vi.mocked(listarMembros).mockResolvedValue([
      buildMembro({ papeis: [{ papel: "PARCERIA" }], vinculosAtivos: 0 }),
    ]);
    vi.mocked(revogarParceria).mockResolvedValue(undefined);

    render(await MembrosPage());

    fireEvent.click(
      screen.getByRole("button", { name: /revogar parceria/i }),
    );

    expect(window.confirm).toHaveBeenCalledWith(
      expect.not.stringMatching(/vínculo/i),
    );
    await waitFor(() =>
      expect(revogarParceria).toHaveBeenCalledWith("membro-1"),
    );
  });

  it("com vínculos ativos: avisa quantos serão desativados", async () => {
    vi.mocked(listarMembros).mockResolvedValue([
      buildMembro({ papeis: [{ papel: "PARCERIA" }], vinculosAtivos: 3 }),
    ]);
    vi.mocked(revogarParceria).mockResolvedValue(undefined);

    render(await MembrosPage());

    fireEvent.click(
      screen.getByRole("button", { name: /revogar parceria/i }),
    );

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining("3 vínculo(s) ativo(s)"),
    );
    await waitFor(() =>
      expect(revogarParceria).toHaveBeenCalledWith("membro-1"),
    );
  });

  it("mostra Suspender e Deletar quando não é a própria conta nem a última ADMIN/GESTORA ativa", async () => {
    vi.mocked(listarMembros).mockResolvedValue([buildMembro()]);

    render(await MembrosPage());

    expect(
      screen.getByRole("button", { name: /suspender/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /deletar/i }),
    ).toBeInTheDocument();
  });

  it("esconde Suspender e Deletar quando a linha é a própria conta logada", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "membro-1" },
    } as unknown as Awaited<ReturnType<typeof auth>>);
    vi.mocked(listarMembros).mockResolvedValue([buildMembro()]);

    render(await MembrosPage());

    expect(
      screen.queryByRole("button", { name: /suspender/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /deletar/i }),
    ).not.toBeInTheDocument();
  });

  it("esconde Suspender e Deletar quando é a última ADMIN/GESTORA ativa (mesmo não sendo a própria conta)", async () => {
    vi.mocked(contarAdminsGestorasAtivos).mockResolvedValue(1);
    vi.mocked(listarMembros).mockResolvedValue([
      buildMembro({ papeis: [{ papel: "GESTORA" }] }),
    ]);

    render(await MembrosPage());

    expect(
      screen.queryByRole("button", { name: /suspender/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /deletar/i }),
    ).not.toBeInTheDocument();
  });
});
