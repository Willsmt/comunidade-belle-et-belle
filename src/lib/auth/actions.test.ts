import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSignOut } = vi.hoisted(() => ({ mockSignOut: vi.fn() }));
vi.mock("@/auth", () => ({ signOut: mockSignOut }));

import { sair } from "./actions";

describe("sair", () => {
  beforeEach(() => mockSignOut.mockReset());

  // /aguardando-aprovacao e /conta-suspensa dependem do logout sem gate.
  it("chama signOut sem exigir sessão ATIVA", async () => {
    await sair();
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});
