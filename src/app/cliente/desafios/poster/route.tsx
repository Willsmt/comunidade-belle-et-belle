import { ImageResponse } from "next/og";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gerarUrlAssinada } from "@/lib/storage/jornada-desafio";

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
        `Poster: falha ao buscar foto (status ${resposta.status}) em ${url}`,
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

  const [fotoAntesPngUri, fotoDepoisPngUri] = await Promise.all([
    carregarFotoComoPngDataUri(fotoAntesUrl),
    carregarFotoComoPngDataUri(fotoDepoisUrl),
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
            {conquistas.map((conquista) => (
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
                {conquista.emblema.icone && (
                  <span style={{ fontSize: 20 }}>{conquista.emblema.icone}</span>
                )}
                <span style={{ fontSize: 16, color: "#B01561", fontWeight: 700 }}>
                  {conquista.emblema.nome}
                </span>
              </div>
            ))}
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
