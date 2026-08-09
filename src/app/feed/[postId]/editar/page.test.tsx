// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("../../queries", () => ({
  obterPost: vi.fn(),
}));
vi.mock("../../actions", () => ({
  editarPost: vi.fn(),
}));
import { editarPost } from "../../actions";
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

import EditarPostPage from "./page";
import { obterPost } from "../../queries";

function buildParams(postId: string) {
  return Promise.resolve({ postId });
}

describe("EditarPostPage", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    vi.mocked(obterPost).mockReset();
  });

  it("redireciona quando o post não existe", async () => {
    mockAuth.mockResolvedValue({ user: { id: "cliente-1" } });
    vi.mocked(obterPost).mockResolvedValue(null);

    await expect(
      EditarPostPage({ params: buildParams("post-x") }),
    ).rejects.toThrow("NEXT_REDIRECT");
  });

  it("redireciona quando quem acessa não é o autor", async () => {
    mockAuth.mockResolvedValue({ user: { id: "cliente-2" } });
    vi.mocked(obterPost).mockResolvedValue({
      id: "post-1",
      autorId: "cliente-1",
      texto: "original",
    } as never);

    await expect(
      EditarPostPage({ params: buildParams("post-1") }),
    ).rejects.toThrow("NEXT_REDIRECT");
  });

  it("renderiza o formulário preenchido pro autor", async () => {
    mockAuth.mockResolvedValue({ user: { id: "cliente-1" } });
    vi.mocked(obterPost).mockResolvedValue({
      id: "post-1",
      autorId: "cliente-1",
      texto: "original",
    } as never);

    render(await EditarPostPage({ params: buildParams("post-1") }));

    expect(screen.getByDisplayValue("original")).toBeInTheDocument();
  });

  it("mostra a mensagem de erro original e mantém o texto editado quando salvar falha", async () => {
    mockAuth.mockResolvedValue({ user: { id: "cliente-1" } });
    vi.mocked(obterPost).mockResolvedValue({
      id: "post-1",
      autorId: "cliente-1",
      texto: "original",
    } as never);
    vi.mocked(editarPost).mockRejectedValue(
      new Error("O post precisa de um texto ou uma imagem"),
    );

    render(await EditarPostPage({ params: buildParams("post-1") }));

    const campoTexto = screen.getByDisplayValue("original") as HTMLTextAreaElement;
    fireEvent.change(campoTexto, { target: { value: "editando..." } });
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "O post precisa de um texto ou uma imagem",
      ),
    );
    expect(campoTexto.value).toBe("editando...");
  });
});
