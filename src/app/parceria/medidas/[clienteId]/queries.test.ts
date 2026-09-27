import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/actions/executar-action";

const { mockRequererPapel, mockFindUniqueVinculo, mockFindUniqueOrThrowUser, mockFindManyMedida } =
  vi.hoisted(() => ({
    mockRequererPapel: vi.fn(),
    mockFindUniqueVinculo: vi.fn(),
    mockFindUniqueOrThrowUser: vi.fn(),
    mockFindManyMedida: vi.fn(),
  }));

vi.mock("@/lib/auth/requerer-acesso-painel", () => ({
  requererPapel: mockRequererPapel,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    vinculoParceria: { findUnique: mockFindUniqueVinculo },
    user: { findUniqueOrThrow: mockFindUniqueOrThrowUser },
    registroMedida: { findMany: mockFindManyMedida },
  },
}));

import { obterMedidasDaCliente } from "./queries";

describe("obterMedidasDaCliente", () => {
  beforeEach(() => {
    mockRequererPapel.mockReset();
    mockFindUniqueVinculo.mockReset();
    mockFindUniqueOrThrowUser.mockReset();
    mockFindManyMedida.mockReset();
  });

  it("exige o papel PARCERIA", async () => {
    mockRequererPapel.mockRejectedValue(new AppError("Acesso negado"));

    await expect(obterMedidasDaCliente("cliente-1")).rejects.toThrow(
      "Acesso negado",
    );
    expect(mockRequererPapel).toHaveBeenCalledWith(["PARCERIA"]);
    expect(mockFindUniqueVinculo).not.toHaveBeenCalled();
  });

  it("retorna cliente e histórico ordenado por data desc quando o vínculo está ativo", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "parceria-1" } });
    mockFindUniqueVinculo.mockResolvedValue({ ativo: true });
    mockFindUniqueOrThrowUser.mockResolvedValue({
      id: "cliente-1",
      name: "Cliente 1",
      email: "cliente1@x.com",
    });
    mockFindManyMedida.mockResolvedValue([{ id: "m1" }, { id: "m2" }]);

    const resultado = await obterMedidasDaCliente("cliente-1");

    expect(mockFindUniqueVinculo).toHaveBeenCalledWith({
      where: {
        clienteId_parceriaId: { clienteId: "cliente-1", parceriaId: "parceria-1" },
      },
    });
    expect(mockFindManyMedida).toHaveBeenCalledWith({
      where: { clienteId: "cliente-1" },
      orderBy: { data: "desc" },
    });
    expect(resultado).toEqual({
      cliente: { id: "cliente-1", name: "Cliente 1", email: "cliente1@x.com" },
      medidas: [{ id: "m1" }, { id: "m2" }],
    });
  });

  it("lança AppError quando não existe nenhum vínculo entre a parceria da sessão e a cliente", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "parceria-1" } });
    mockFindUniqueVinculo.mockResolvedValue(null);

    await expect(obterMedidasDaCliente("cliente-1")).rejects.toThrow(
      "Cliente não vinculada a você",
    );
    expect(mockFindManyMedida).not.toHaveBeenCalled();
  });

  it("lança AppError quando o vínculo existe mas está inativo", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "parceria-1" } });
    mockFindUniqueVinculo.mockResolvedValue({ ativo: false });

    await expect(obterMedidasDaCliente("cliente-1")).rejects.toThrow(
      "Cliente não vinculada a você",
    );
    expect(mockFindManyMedida).not.toHaveBeenCalled();
  });

  it("lança AppError quando o único vínculo da cliente é com outra parceria (a busca já é escopada por parceriaId da sessão)", async () => {
    mockRequererPapel.mockResolvedValue({ user: { id: "parceria-1" } });
    // findUnique com a chave composta clienteId_parceriaId da sessão retorna
    // null quando o vínculo existente pertence a outra parceria.
    mockFindUniqueVinculo.mockResolvedValue(null);

    await expect(obterMedidasDaCliente("cliente-1")).rejects.toThrow(
      "Cliente não vinculada a você",
    );
    expect(mockFindUniqueVinculo).toHaveBeenCalledWith({
      where: {
        clienteId_parceriaId: { clienteId: "cliente-1", parceriaId: "parceria-1" },
      },
    });
  });
});
