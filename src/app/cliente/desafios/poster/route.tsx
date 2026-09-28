import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ImageResponse } from "next/og";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gerarUrlAssinada } from "@/lib/storage/jornada-desafio";
import { ehNomeIconeEmblemaValido } from "@/lib/emblemas/icones";

export const runtime = "nodejs";

// O Satori (usado pelo next/og) não decodifica WebP, formato em que as
// fotos da jornada sempre são gravadas no R2. Buscamos o arquivo e
// convertemos para PNG só para esta renderização — nada é regravado no R2.
//
// O import de "sharp" é dinâmico de propósito: o próprio next/og importa
// "sharp" assim (via um getSharp() interno) para não forçar o bundler a
// empacotar esse addon nativo junto do route handler. Um `import` estático
// aqui faz o Turbopack tratar esse mesmo pacote nativo de um jeito diferente
// do next/og, e as duas instâncias divergentes de sharp corrompem o passo
// final de rasterização do SVG (erro "Input buffer contains unsupported
// image format" vindo de dentro do próprio next/og, não deste arquivo).
async function carregarFotoComoPngDataUri(url: string | null): Promise<string | null> {
  if (!url) return null;

  try {
    const resposta = await fetch(url);
    if (!resposta.ok) {
      console.error(
        `Poster: falha ao buscar foto (status ${resposta.status})`,
      );
      return null;
    }
    const bufferOriginal = Buffer.from(await resposta.arrayBuffer());
    const sharp = (await import("sharp")).default;
    const bufferPng = await sharp(bufferOriginal).png().toBuffer();
    return `data:image/png;base64,${bufferPng.toString("base64")}`;
  } catch (erro) {
    console.error("Poster: falha ao converter foto para PNG:", erro);
    return null;
  }
}

// Mesma restrição do Satori que motiva a conversão de foto acima: ele não
// executa um dispatcher de Hooks do React, então o componente de ícone do
// lucide-react (que é "use client" e usa useContext internamente) quebra se
// renderizado direto na árvore do ImageResponse. Antes resolvíamos isso
// pré-renderizando o componente para SVG com renderToStaticMarkup, mas
// react-dom/server é bloqueado (sem exports) dentro de Route Handlers nesta
// versão do Next — a condição "react-server" do bundler existe justamente
// para impedir mistura de runtimes do React aqui. Em vez de renderizar o
// componente, lemos o SVG estático do lucide-static (sem depender de React)
// e só trocamos a cor do stroke.
function paraKebabCase(nome: string): string {
  return nome.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

async function carregarIconeEmblemaComoPngDataUri(
  nomeIcone: string | null,
  cor: string,
): Promise<string | null> {
  if (!nomeIcone || !ehNomeIconeEmblemaValido(nomeIcone)) return null;

  try {
    const caminhoSvg = fileURLToPath(
      import.meta.resolve(`lucide-static/icons/${paraKebabCase(nomeIcone)}.svg`),
    );
    const svgOriginal = readFileSync(caminhoSvg, "utf-8");
    const svgColorido = svgOriginal.replaceAll("currentColor", cor);
    const sharp = (await import("sharp")).default;
    const bufferPng = await sharp(Buffer.from(svgColorido)).png().toBuffer();
    return `data:image/png;base64,${bufferPng.toString("base64")}`;
  } catch (erro) {
    console.error("Poster: falha ao converter ícone de emblema para PNG:", erro);
    return null;
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Não autorizado", { status: 401 });
  }

  const clienteId = session.user.id;

  const desafio = await prisma.desafio.findFirst({
    where: { ativo: false },
    orderBy: { criadoEm: "desc" },
  });

  if (!desafio) {
    return new Response("Nenhum desafio encerrado encontrado", { status: 404 });
  }

  const [jornada, conquistas] = await Promise.all([
    prisma.jornadaDesafio.findUnique({
      where: { desafioId_clienteId: { desafioId: desafio.id, clienteId } },
    }),
    prisma.conquista.findMany({
      where: { clienteId, desafioId: desafio.id },
      include: { emblema: true },
    }),
  ]);

  const fotoAntesUrl = jornada?.fotoAntesChave
    ? await gerarUrlAssinada(jornada.fotoAntesChave)
    : null;
  const fotoDepoisUrl = jornada?.fotoDepoisChave
    ? await gerarUrlAssinada(jornada.fotoDepoisChave)
    : null;

  const [fotoAntesPngUri, fotoDepoisPngUri, iconesEmblemaPorConquista] = await Promise.all([
    carregarFotoComoPngDataUri(fotoAntesUrl),
    carregarFotoComoPngDataUri(fotoDepoisUrl),
    Promise.all(
      conquistas.map((conquista) =>
        carregarIconeEmblemaComoPngDataUri(conquista.emblema.icone, "#B01561"),
      ),
    ),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#fdf2f6",
          padding: 48,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", fontSize: 14, color: "#b0708a" }}>
          Belle et Belle · by Patrícia Almeida
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 12,
          }}
        >
          <div style={{ fontSize: 40, fontWeight: 700, color: "#D81E78" }}>
            {desafio.titulo}
          </div>
          <div style={{ fontSize: 20, color: "#B01561", marginTop: 8 }}>
            30 dias de disciplina e amor próprio 💗
          </div>
        </div>

        {conquistas.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 12,
              marginTop: 24,
            }}
          >
            {conquistas.map((conquista, indice) => {
              const iconeUri = iconesEmblemaPorConquista[indice];
              return (
                <div
                  key={conquista.id}
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    backgroundColor: "#fff",
                    padding: "10px 18px",
                    borderRadius: 999,
                    border: "2px solid #f8bbd0",
                  }}
                >
                  {iconeUri && (
                    <img
                      src={iconeUri}
                      width={20}
                      height={20}
                      style={{ objectFit: "contain" }}
                    />
                  )}
                  <span style={{ fontSize: 16, color: "#B01561", fontWeight: 700 }}>
                    {conquista.emblema.nome}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            gap: 32,
            marginTop: 40,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontSize: 18, color: "#B01561", marginBottom: 8 }}>Antes</div>
            {fotoAntesPngUri ? (
              <img
                src={fotoAntesPngUri}
                alt="Foto de antes"
                width={220}
                height={220}
                style={{ objectFit: "cover", borderRadius: 16, border: "4px solid #fff" }}
              />
            ) : (
              <div
                style={{
                  width: 220,
                  height: 220,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#fce4ec",
                  borderRadius: 16,
                  color: "#c2185b",
                  fontSize: 16,
                }}
              >
                Sem foto
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontSize: 18, color: "#B01561", marginBottom: 8 }}>Depois</div>
            {fotoDepoisPngUri ? (
              <img
                src={fotoDepoisPngUri}
                alt="Foto de depois"
                width={220}
                height={220}
                style={{ objectFit: "cover", borderRadius: 16, border: "4px solid #fff" }}
              />
            ) : (
              <div
                style={{
                  width: 220,
                  height: 220,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#fce4ec",
                  borderRadius: 16,
                  color: "#c2185b",
                  fontSize: 16,
                }}
              >
                Sem foto
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 40, gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 16, color: "#D81E78", fontWeight: 700 }}>
              O que mais mudou em mim nesses 30 dias?
            </div>
            <div style={{ fontSize: 18, color: "#3a2233" }}>
              {jornada?.reflexaoMudou ?? "—"}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 16, color: "#D81E78", fontWeight: 700 }}>
              Do que mais me orgulho?
            </div>
            <div style={{ fontSize: 18, color: "#3a2233" }}>
              {jornada?.reflexaoOrgulho ?? "—"}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 16, color: "#D81E78", fontWeight: 700 }}>
              O que vou continuar fazendo?
            </div>
            <div style={{ fontSize: 18, color: "#3a2233" }}>
              {jornada?.reflexaoContinuar ?? "—"}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "auto",
            fontSize: 18,
            color: "#D81E78",
            fontWeight: 700,
          }}
        >
          Você é capaz, você é forte e você merece brilhar! ✨
        </div>
      </div>
    ),
    {
      width: 1000,
      height: 1400,
    },
  );
}
