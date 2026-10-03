/**
 * Seed de usuários e dados para o teste de carga — preenchido para
 * comunidade-belle-et-belle (Prisma + NextAuth v5, sessão em banco).
 *
 * Roda contra o DATABASE_URL de loadtest.env (banco de teste isolado, nunca
 * o do .env real do projeto). O gate do proxy (src/proxy.ts →
 * src/lib/auth/route-decision.ts) exige status "ATIVO" + consentimento aceito
 * para liberar as rotas normais; os layouts de área exigem o papel
 * (CLIENTE / GESTORA|ADMIN / PARCERIA — src/lib/auth/pode-acessar-painel.ts).
 * Tudo isso é replicado abaixo e reverificado em hasAccess().
 *
 * Personas semeadas:
 *   - 1 cliente principal (loadtest@example.com) + N_CLIENTES_EXTRAS clientes,
 *     cada uma com sessão própria (o k6 distribui as VUs entre elas);
 *   - 1 gestora (GESTORA) para /painel/*;
 *   - 1 parceria (PARCERIA) para /parceria/*, vinculada a parte das clientes;
 *   - N_PENDENTES contas PENDENTE (populam /painel/aprovacoes).
 *
 * Dados: posts com comentários/curtidas + 1 destaque, desafio ativo com
 * categorias/itens/marcações (ranking semanal e geral), desafio encerrado,
 * desafios surpresa, emblemas/conquistas, medidas, fotos de evolução, planos,
 * tipos de sessão/pacote e ciclo de pacote com sessões realizadas.
 *
 * Chaves de objeto (imagemChave, fotoChave, arquivoChave) são fictícias: as
 * páginas só geram URL assinada localmente (getSignedUrl, sem rede) com as
 * credenciais placeholder de loadtest.env — nada é baixado nem enviado ao R2.
 *
 * Idempotente: grantAccess() começa chamando purgeData(), que apaga tudo que
 * este seed criou (e-mails "loadtest*", títulos/nomes com PREFIXO).
 */
import { PrismaClient } from "../../../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

export const SEED_CONFIGURED = true;

export type UsuarioSemeado = {
  id: string;
  email: string;
  cookies: Record<string, string>;
};

// Nome do cookie: NextAuth v5 usa "authjs.session-token" sem HTTPS
// (localhost) e "__Secure-authjs.session-token" com HTTPS. loadtest.env
// aponta AUTH_URL para http://, então é a variante sem prefixo.
const NOME_COOKIE = "authjs.session-token";

const EMAIL = "loadtest@example.com";
const EMAIL_GESTORA = "loadtest-gestora@example.com";
const EMAIL_PARCERIA = "loadtest-parceria@example.com";
const PREFIXO_EMAIL = "loadtest";
const PREFIXO = "[loadtest]";

const N_CLIENTES_EXTRAS = 39; // + a principal = 40 clientes
const N_PENDENTES = 5;
const N_POSTS = 60;
const N_VINCULADAS = 15;

// Tokens fixos e públicos (estão no repositório) — por isso o seed só roda
// contra banco local (ver obterUrlDoBancoLocal).
function tokenSessao(sufixo: string) {
  return `loadtest-fixed-session-token-${sufixo}`;
}

// Auth.js regrava a sessão no banco a cada request quando
// expires - maxAge(30d) + updateAge(24h) <= agora. Uma sessão real nasce com
// expires = agora + 30d e só é regravada 1x/dia; semear com expiração curta
// faria TODO request escrever na tabela Session (artefato do teste, não do app).
const EXPIRACAO_SESSAO_MS = 30 * 24 * 60 * 60 * 1000;

const HOSTS_PERMITIDOS = new Set(["localhost", "127.0.0.1"]);

function obterUrlDoBancoLocal(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL não definida (use o banco de loadtest.env).");
  }
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    throw new Error("DATABASE_URL inválida.");
  }
  if (!HOSTS_PERMITIDOS.has(host)) {
    throw new Error(
      `Seed recusado: o host "${host}" não é local. Só roda contra localhost/127.0.0.1.`,
    );
  }
  return url;
}

function criarPrisma() {
  const adapter = new PrismaPg({ connectionString: obterUrlDoBancoLocal() });
  return new PrismaClient({ adapter });
}

type Prisma = ReturnType<typeof criarPrisma>;

// Pseudo-aleatório determinístico (mesmo dataset a cada run → comparável).
let semente = 42;
function aleatorio() {
  semente = (semente * 1103515245 + 12345) % 2147483648;
  return semente / 2147483648;
}
function inteiro(min: number, max: number) {
  return min + Math.floor(aleatorio() * (max - min + 1));
}

function hojeUtc(): Date {
  // Mesmo critério de src/lib/hoje.ts (data de São Paulo, meia-noite UTC).
  const dataBrasil = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
  return new Date(`${dataBrasil}T00:00:00.000Z`);
}
function diasAtras(base: Date, dias: number) {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() - dias);
  return d;
}

async function criarUsuarioAtivo(
  prisma: Prisma,
  email: string,
  nome: string,
  papel: "CLIENTE" | "GESTORA" | "PARCERIA",
  sufixoToken: string,
) {
  const user = await prisma.user.create({
    data: {
      email,
      name: nome,
      status: "ATIVO",
      emailVerified: new Date(),
      aprovadoEm: new Date(),
      papeis: { create: { papel } },
      consentimento: { create: { versaoTermo: "loadtest" } },
      sessions: {
        create: {
          sessionToken: tokenSessao(sufixoToken),
          expires: new Date(Date.now() + EXPIRACAO_SESSAO_MS),
        },
      },
    },
  });
  return { id: user.id, email: user.email, cookies: { [NOME_COOKIE]: tokenSessao(sufixoToken) } };
}

// Saída do seed, lida pelo k6 (.seed-output.json). Campos top-level
// id/email/cookies = cliente principal (compatível com o contrato genérico).
type SaidaSeed = UsuarioSemeado & {
  clientes: (UsuarioSemeado & { postId: string | null })[];
  gestora: UsuarioSemeado;
  parceria: UsuarioSemeado;
  desafioAtivoId: string;
  desafioEncerradoId: string;
  membrosComCicloIds: string[];
  clientesVinculadasIds: string[];
};

let saida: SaidaSeed | null = null;

export async function grantAccess(): Promise<UsuarioSemeado> {
  await purgeData();
  const prisma = criarPrisma();
  try {
    const principal = await criarUsuarioAtivo(prisma, EMAIL, "Load Test User", "CLIENTE", "000111222");
    const clientes = [principal];
    for (let i = 1; i <= N_CLIENTES_EXTRAS; i++) {
      const n = String(i).padStart(2, "0");
      clientes.push(
        await criarUsuarioAtivo(prisma, `loadtest-cliente-${n}@example.com`, `Cliente Loadtest ${n}`, "CLIENTE", `cliente-${n}`),
      );
    }
    const gestora = await criarUsuarioAtivo(prisma, EMAIL_GESTORA, "Gestora Loadtest", "GESTORA", "gestora");
    const parceria = await criarUsuarioAtivo(prisma, EMAIL_PARCERIA, "Parceria Loadtest", "PARCERIA", "parceria");

    for (let i = 1; i <= N_PENDENTES; i++) {
      await prisma.user.create({
        data: { email: `loadtest-pendente-${i}@example.com`, name: `Pendente ${i}`, status: "PENDENTE" },
      });
    }

    saida = {
      ...principal,
      clientes: clientes.map((c) => ({ ...c, postId: null })),
      gestora,
      parceria,
      desafioAtivoId: "",
      desafioEncerradoId: "",
      membrosComCicloIds: [],
      clientesVinculadasIds: [],
    };
    return principal;
  } finally {
    await prisma.$disconnect();
  }
}

// Replica o gate real consultando o banco: proxy (status ATIVO +
// consentimento) + papel exigido pelo layout de cada área + sessão válida.
export async function hasAccess(usuario: UsuarioSemeado): Promise<boolean> {
  const prisma = criarPrisma();
  try {
    const alvos: { u: UsuarioSemeado; papel: string }[] = [{ u: usuario, papel: "CLIENTE" }];
    if (saida) {
      for (const c of saida.clientes) alvos.push({ u: c, papel: "CLIENTE" });
      alvos.push({ u: saida.gestora, papel: "GESTORA" });
      alvos.push({ u: saida.parceria, papel: "PARCERIA" });
    }
    for (const { u, papel } of alvos) {
      const user = await prisma.user.findUnique({
        where: { id: u.id },
        select: {
          status: true,
          consentimento: { select: { id: true } },
          papeis: { select: { papel: true } },
          sessions: { where: { sessionToken: u.cookies[NOME_COOKIE] }, select: { expires: true } },
        },
      });
      const ok =
        user?.status === "ATIVO" &&
        user.consentimento !== null &&
        user.papeis.some((p) => p.papel === papel) &&
        user.sessions.length === 1 &&
        user.sessions[0].expires > new Date();
      if (!ok) {
        console.error(`Usuário ${u.email} não passa no gate (papel ${papel}).`);
        return false;
      }
    }
    return true;
  } finally {
    await prisma.$disconnect();
  }
}

export async function seedData(_usuario: UsuarioSemeado): Promise<void> {
  if (!saida) throw new Error("grantAccess() precisa rodar antes de seedData().");
  const s = saida;
  const prisma = criarPrisma();
  const hoje = hojeUtc();
  const clienteIds = s.clientes.map((c) => c.id);
  try {
    // ---------- Perfis (perfil público, avatar com URL assinada) ----------
    await prisma.perfil.createMany({
      data: clienteIds.map((id, i) => ({
        userId: id,
        bio: `Bio da cliente ${i}`,
        bioPublica: true,
        emblemasPublicos: true,
        medidasPublicas: i % 2 === 0,
        fotoChave: i % 3 === 0 ? `loadtest/perfil/${id}.webp` : null,
      })),
    });

    // ---------- Medidas e fotos de evolução ----------
    const medidas = [];
    const fotos = [];
    for (const [i, id] of clienteIds.entries()) {
      const nMedidas = i === 0 ? 12 : 6;
      for (let m = 0; m < nMedidas; m++) {
        medidas.push({
          clienteId: id,
          data: diasAtras(hoje, m * 30),
          peso: 60 + inteiro(0, 200) / 10,
          cintura: 65 + inteiro(0, 150) / 10,
          quadril: 90 + inteiro(0, 150) / 10,
          abdomen: 70 + inteiro(0, 150) / 10,
          bracoDireito: 26 + inteiro(0, 50) / 10,
          bracoEsquerdo: 26 + inteiro(0, 50) / 10,
          coxaDireita: 50 + inteiro(0, 80) / 10,
          coxaEsquerda: 50 + inteiro(0, 80) / 10,
        });
      }
      const nFotos = i === 0 ? 8 : 3;
      for (let f = 0; f < nFotos; f++) {
        fotos.push({ clienteId: id, chave: `loadtest/fotos/${id}-${f}.webp`, data: diasAtras(hoje, f * 15), publica: f % 2 === 0 });
      }
    }
    await prisma.registroMedida.createMany({ data: medidas });
    await prisma.fotoEvolucao.createMany({ data: fotos });

    // ---------- Feed: posts, comentários, curtidas, destaque ----------
    for (let p = 0; p < N_POSTS; p++) {
      const autorIdx = p < 5 ? 0 : inteiro(0, clienteIds.length - 1);
      const post = await prisma.post.create({
        data: {
          autorId: clienteIds[autorIdx],
          texto: `Post de teste de carga número ${p}`,
          imagemChave: p % 3 === 0 ? `loadtest/posts/${p}.webp` : null,
          destaque: p === 7,
          criadoEm: new Date(Date.now() - p * 60 * 60 * 1000),
        },
      });
      if (s.clientes[autorIdx].postId === null) s.clientes[autorIdx].postId = post.id;
      const nComentarios = inteiro(0, 5);
      if (nComentarios > 0) {
        await prisma.comentario.createMany({
          data: Array.from({ length: nComentarios }, (_, k) => ({
            postId: post.id,
            autorId: clienteIds[inteiro(0, clienteIds.length - 1)],
            texto: `Comentário ${k}`,
          })),
        });
      }
      const curtidores = new Set<string>();
      const nLikes = inteiro(0, 12);
      for (let k = 0; k < nLikes; k++) curtidores.add(clienteIds[inteiro(0, clienteIds.length - 1)]);
      await prisma.like.createMany({ data: [...curtidores].map((usuarioId) => ({ postId: post.id, usuarioId })) });
    }

    // ---------- Emblemas ----------
    const emblemas = [];
    for (let e = 0; e < 5; e++) {
      emblemas.push(
        await prisma.emblema.create({
          data: { nome: `${PREFIXO} Emblema ${e}`, descricao: `Emblema de teste ${e}`, icone: "trophy" },
        }),
      );
    }

    // ---------- Desafio encerrado (histórico) e desafio ativo ----------
    await prisma.desafio.updateMany({ where: { ativo: true }, data: { ativo: false } });
    const encerrado = await prisma.desafio.create({
      data: {
        titulo: `${PREFIXO} Desafio encerrado`,
        dataInicio: diasAtras(hoje, 60),
        dataFim: diasAtras(hoje, 31),
        ativo: false,
        criadoEm: diasAtras(hoje, 61),
      },
    });
    const ativo = await prisma.desafio.create({
      data: {
        titulo: `${PREFIXO} Desafio ativo`,
        fraseMotivacional: "Bora!",
        dataInicio: diasAtras(hoje, 14),
        dataFim: diasAtras(hoje, -14),
        ativo: true,
        emblemaRankingSemanalId: emblemas[0].id,
        emblemaRankingGeralId: emblemas[1].id,
      },
    });

    const itens: { id: string; exigeFoto: boolean }[] = [];
    const cores = ["#e11d48", "#2563eb", "#16a34a"];
    for (let c = 0; c < 3; c++) {
      const categoria = await prisma.categoriaDesafio.create({
        data: { desafioId: ativo.id, nome: `Categoria ${c}`, cor: cores[c] },
      });
      for (let k = 0; k < 4; k++) {
        const item = await prisma.itemDesafio.create({
          data: {
            categoriaId: categoria.id,
            descricao: `Item ${c}-${k}`,
            pontos: inteiro(1, 5) * 5,
            exigeFoto: k === 3,
          },
        });
        itens.push({ id: item.id, exigeFoto: item.exigeFoto });
      }
    }
    await prisma.regraBonus.create({
      data: { desafioId: ativo.id, tipo: "LIMIAR_DIARIO", pontosExtras: 10, limiarItens: 5, emblemaId: emblemas[2].id },
    });

    // Marcações: 14 dias × 40 clientes × ~5 itens validados; ~15 pendentes
    // (com foto) para a fila de aprovações.
    const marcacoes = [];
    for (const clienteId of clienteIds) {
      for (let d = 0; d <= 14; d++) {
        const data = diasAtras(hoje, d);
        for (const item of itens) {
          if (aleatorio() < 0.4) {
            const pendente = item.exigeFoto && aleatorio() < 0.05;
            marcacoes.push({
              itemId: item.id,
              clienteId,
              data,
              validado: !pendente,
              fotoChave: item.exigeFoto ? `loadtest/comprovantes/${clienteId}-${d}.webp` : null,
            });
          }
        }
      }
    }
    await prisma.marcacaoItem.createMany({ data: marcacoes });

    for (let k = 0; k < 2; k++) {
      const surpresa = await prisma.desafioSurpresa.create({
        data: { desafioId: ativo.id, titulo: `Surpresa ${k}`, descricao: "Desafio surpresa", pontos: 20, exigeComprovacao: k === 1 },
      });
      await prisma.participacaoSurpresa.createMany({
        data: clienteIds.slice(1, 16).map((clienteId, j) => ({
          desafioSurpresaId: surpresa.id,
          clienteId,
          validado: j % 4 !== 0,
          fotoChave: k === 1 ? `loadtest/surpresa/${clienteId}.webp` : null,
        })),
      });
    }

    await prisma.jornadaDesafio.create({
      data: { desafioId: ativo.id, clienteId: clienteIds[0], fotoAntesChave: `loadtest/jornada/${clienteIds[0]}-antes.webp` },
    });
    await prisma.conquista.createMany({
      data: [0, 1, 2].map((e) => ({
        clienteId: clienteIds[0],
        desafioId: encerrado.id,
        emblemaId: emblemas[e].id,
        tipo: "BONUS" as const,
      })),
    });

    // ---------- Parcerias: vínculos, perfil, planos ----------
    await prisma.perfilParceria.create({
      data: { usuarioId: s.parceria.id, especialidade: "Nutricionista", bio: "Parceria de teste", fotoChave: "loadtest/parcerias/foto.webp" },
    });
    const vinculadas = clienteIds.slice(0, N_VINCULADAS);
    await prisma.vinculoParceria.createMany({
      data: vinculadas.map((clienteId) => ({ clienteId, parceriaId: s.parceria.id, criadoPorId: s.gestora.id })),
    });
    await prisma.planoRecebido.createMany({
      data: vinculadas.flatMap((clienteId, i) =>
        Array.from({ length: i === 0 ? 4 : 2 }, (_, k) => ({
          clienteId,
          parceriaId: s.parceria.id,
          tipo: k % 2 === 0 ? ("TREINO" as const) : ("DIETA" as const),
          titulo: `Plano ${k}`,
          arquivoChave: `loadtest/planos/${clienteId}-${k}.pdf`,
        })),
      ),
    });

    // ---------- Pacotes: tipos, ciclos ativos e sessões realizadas ----------
    const tiposSessao = [];
    for (const nome of ["Personal", "Estúdio", "Avaliação"]) {
      tiposSessao.push(await prisma.tipoSessao.create({ data: { nome: `${PREFIXO} ${nome}` } }));
    }
    const tipoPacote = await prisma.tipoPacote.create({
      data: {
        nome: `${PREFIXO} Pacote mensal`,
        itens: { create: tiposSessao.map((t, i) => ({ tipoSessaoId: t.id, quantidade: 4 + i * 2 })) },
      },
    });
    await prisma.tipoPacote.create({
      data: {
        nome: `${PREFIXO} Pacote trimestral`,
        itens: { create: tiposSessao.slice(0, 2).map((t) => ({ tipoSessaoId: t.id, quantidade: 12 })) },
      },
    });
    const membrosComCiclo = clienteIds.slice(0, 20);
    for (const clienteId of membrosComCiclo) {
      await prisma.cicloPacote.create({
        data: {
          clienteId,
          tipoPacoteId: tipoPacote.id,
          nomePacote: tipoPacote.nome,
          ativo: true,
          itens: { create: tiposSessao.map((t, i) => ({ tipoSessaoId: t.id, quantidadeContratada: 4 + i * 2 })) },
          sessoes: {
            create: Array.from({ length: 6 }, (_, k) => ({
              tipoSessaoId: tiposSessao[k % tiposSessao.length].id,
              data: diasAtras(hoje, k * 3),
              marcadoPorId: s.gestora.id,
            })),
          },
        },
      });
    }

    s.desafioAtivoId = ativo.id;
    s.desafioEncerradoId = encerrado.id;
    s.membrosComCicloIds = membrosComCiclo;
    s.clientesVinculadasIds = vinculadas;

    const semPost = s.clientes.filter((c) => c.postId === null).length;
    console.error(
      `Seed: ${clienteIds.length} clientes (${semPost} sem post próprio), ${N_POSTS} posts, ` +
        `${marcacoes.length} marcações, ${medidas.length} medidas, ${fotos.length} fotos.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Apaga tudo que este seed cria. Ordem importa: SessaoRealizada.marcadoPor,
// CicloPacote.tipoPacote, ItemTipoPacote.tipoSessao e Conquista.emblema não
// caem em cascata ao apagar o usuário.
export async function purgeData(): Promise<void> {
  const prisma = criarPrisma();
  try {
    const doSeed = { email: { startsWith: PREFIXO_EMAIL } };
    await prisma.sessaoRealizada.deleteMany({
      where: { OR: [{ marcadoPor: doSeed }, { cicloPacote: { cliente: doSeed } }] },
    });
    await prisma.cicloPacote.deleteMany({ where: { cliente: doSeed } });
    await prisma.desafio.deleteMany({ where: { titulo: { startsWith: PREFIXO } } });
    await prisma.conquista.deleteMany({ where: { emblema: { nome: { startsWith: PREFIXO } } } });
    await prisma.emblema.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
    await prisma.tipoPacote.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
    await prisma.tipoSessao.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
    await prisma.user.deleteMany({ where: doSeed });
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const usuario = await grantAccess();
  await seedData(usuario);

  const ok = await hasAccess(usuario);
  if (!ok) {
    console.error(
      "Usuário semeado NÃO passa no gate de acesso do proxy — corrija grantAccess()/hasAccess().",
    );
    process.exit(1);
  }

  console.log(JSON.stringify(saida));
}

main().catch((erro) => {
  console.error("Falha ao semear usuário de teste:", erro);
  process.exit(1);
});
