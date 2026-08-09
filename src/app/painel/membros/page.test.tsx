// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import MembrosPage from "./page";
import { listarMembros } from "./queries";
import { promoverAParceria, revogarParceria } from "./actions";
import type { Papel, StatusConta } from "@/generated/prisma/client";

vi.mock("./queries", () => ({
  listarMembros: vi.fn(),
}));

vi.mock("./actions", () => ({
  suspenderMembro: vi.fn(),
  reativarMembro: vi.fn(),
  deletarMembro: vi.fn(),
  promoverAParceria: vi.fn(),
  revogarParceria: vi.fn(),
}));

function buildMembro(
  overrides: { status?: StatusConta; papeis?: { papel: Papel }[] } = {},
) {
  return {
    id: "membro-1",
    name: "Fulana",
    email: "fulana@x.com",
    image: null,
    status: "ATIVO" as StatusConta,
    papeis: [] as { papel: Papel }[],
    ...overrides,
  };
}

describe("MembrosPage", () => {
  beforeEach(() => {
    vi.mocked(listarMembros).mockReset();
    vi.mocked(promoverAParceria).mockReset();
    vi.mocked(revogarParceria).mockReset();
    vi.spyOn(window, "confirm").mockReturnValue(true);
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

  it("ao clicar em Revogar Parceria: pede confirmação e chama a action", async () => {
    vi.mocked(listarMembros).mockResolvedValue([
      buildMembro({ papeis: [{ papel: "PARCERIA" }] }),
    ]);
    vi.mocked(revogarParceria).mockResolvedValue(undefined);

    render(await MembrosPage());

    fireEvent.click(
      screen.getByRole("button", { name: /revogar parceria/i }),
    );

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() =>
      expect(revogarParceria).toHaveBeenCalledWith("membro-1"),
    );
  });
});
