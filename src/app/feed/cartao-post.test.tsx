// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("./actions", () => ({
  apagarPost: vi.fn(),
  alternarCurtida: vi.fn(),
  comentar: vi.fn(),
  apagarComentario: vi.fn(),
  alternarDestaque: vi.fn(),
}));

import { CartaoPost } from "./cartao-post";

const URL_ORIGINAL = "https://bucket.conta.r2.cloudflarestorage.com/foto.webp?X-Amz-Signature=abc";

function buildPost(overrides: Record<string, unknown> = {}) {
  return {
    id: "post-1",
    autorId: "cliente-1",
    texto: null,
    imagemChave: "fotos-evolucao/cliente-1/x.webp",
    urlImagem: URL_ORIGINAL,
    fotoEvolucaoId: null,
    criadoEm: new Date("2026-02-01"),
    atualizadoEm: new Date("2026-02-01"),
    autor: { id: "cliente-1", name: "Cliente 1" },
    curtidoPeloUsuario: false,
    totalCurtidas: 0,
    comentarios: [],
    destaque: false,
    ...overrides,
  };
}

function renderizar(post: ReturnType<typeof buildPost>) {
  render(
    <CartaoPost
      post={post as never}
      usuarioId="outra-pessoa"
      podeModerar={false}
    />,
  );
  // O zoom (<img> do FotoComZoom) só existe com o diálogo aberto; a imagem
  // do cartão é a única <img> com este alt.
  return screen.getByAltText("Imagem do post");
}

describe("CartaoPost", () => {
  it("renderiza com ImagemSensivel (URL direta, sem otimizador) quando o post tem fotoEvolucaoId", () => {
    const imagem = renderizar(buildPost({ fotoEvolucaoId: "foto-1" }));

    expect(imagem).toHaveAttribute("src", URL_ORIGINAL);
  });

  it("mantém o next/image otimizado quando o post não tem fotoEvolucaoId", () => {
    const imagem = renderizar(buildPost({ fotoEvolucaoId: null }));

    expect(imagem.getAttribute("src")).toContain("/_next/image");
  });
});
