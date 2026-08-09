// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("../../queries", () => ({
  obterPost: vi.fn(),
}));
vi.mock("../../actions", () => ({
  editarPost: vi.fn(),
}));
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
});
