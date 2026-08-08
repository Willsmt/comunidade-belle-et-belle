import { ImageResponse } from "next/og";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gerarUrlAssinada } from "@/lib/storage/jornada-desafio";

export const runtime = "nodejs";

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
          <div style={{ fontSize: 40, fontWeight: 700, color: "#d6336c" }}>
            {desafio.titulo}
          </div>
          <div style={{ fontSize: 20, color: "#862e4a", marginTop: 8 }}>
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
                <span style={{ fontSize: 16, color: "#862e4a", fontWeight: 700 }}>
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
            <div style={{ fontSize: 18, color: "#862e4a", marginBottom: 8 }}>Antes</div>
            {fotoAntesUrl ? (
              <img
                src={fotoAntesUrl}
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
            <div style={{ fontSize: 18, color: "#862e4a", marginBottom: 8 }}>Depois</div>
            {fotoDepoisUrl ? (
              <img
                src={fotoDepoisUrl}
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
            <div style={{ fontSize: 16, color: "#d6336c", fontWeight: 700 }}>
              O que mais mudou em mim nesses 30 dias?
            </div>
            <div style={{ fontSize: 18, color: "#3a2233" }}>
              {jornada?.reflexaoMudou ?? "—"}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 16, color: "#d6336c", fontWeight: 700 }}>
              Do que mais me orgulho?
            </div>
            <div style={{ fontSize: 18, color: "#3a2233" }}>
              {jornada?.reflexaoOrgulho ?? "—"}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 16, color: "#d6336c", fontWeight: 700 }}>
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
            color: "#d6336c",
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
