// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { useSession } from "next-auth/react";
import AguardandoAprovacaoPage from "./page";

const mockUpdate = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("@/lib/auth/actions", () => ({
  sair: vi.fn(),
}));

function mockSessao(status: string) {
  vi.mocked(useSession).mockReturnValue({
    data: {
      user: { status, temConsentimento: false },
      expires: new Date().toISOString(),
    },
    status: "authenticated",
    update: mockUpdate,
  } as unknown as ReturnType<typeof useSession>);
}

describe("AguardandoAprovacaoPage", () => {
  beforeEach(() => {
    mockUpdate.mockClear();
    mockRefresh.mockClear();
    mockSessao("PENDENTE");
  });

  it("mostra a mensagem de espera", () => {
    render(<AguardandoAprovacaoPage />);
    expect(
      screen.getByText(/aguardando aprovação da Patrícia/i),
    ).toBeInTheDocument();
  });

  it("botão 'Verificar novamente' chama update()", () => {
    render(<AguardandoAprovacaoPage />);
    fireEvent.click(screen.getByRole("button", { name: /verificar novamente/i }));
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  it("chama router.refresh() quando o status deixa de ser PENDENTE", () => {
    const { rerender } = render(<AguardandoAprovacaoPage />);
    mockSessao("ATIVO");
    rerender(<AguardandoAprovacaoPage />);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it("não chama router.refresh() enquanto o status continua PENDENTE", () => {
    const { rerender } = render(<AguardandoAprovacaoPage />);
    rerender(<AguardandoAprovacaoPage />);
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
