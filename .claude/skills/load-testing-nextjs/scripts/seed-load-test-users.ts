/**
 * Seed de usuário para o teste de carga — preenchido para
 * comunidade-belle-et-belle (Prisma + NextAuth v5, sessão em banco).
 *
 * Roda contra o DATABASE_URL de loadtest.env (banco de teste isolado, nunca
 * o do .env real do projeto). O gate do middleware
 * (src/lib/auth/route-decision.ts) exige status "ATIVO" + consentimento
 * aceito para liberar as rotas normais — replicado abaixo.
 */
import { PrismaClient } from "../../../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

export const SEED_CONFIGURED = true;

export type UsuarioSemeado = {
  id: string;
  email: string;
  cookies: Record<string, string>;
};

const EMAIL = "loadtest@example.com";
const SESSION_TOKEN = "loadtest-fixed-session-token-000111222";

const HOSTS_PERMITIDOS = new Set(["localhost", "127.0.0.1"]);

// O token de sessão acima é fixo e público (está no repositório). Por isso o
// seed só pode rodar contra um banco local isolado: qualquer outro host recusa.
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

export async function grantAccess(): Promise<UsuarioSemeado> {
  const prisma = criarPrisma();
  try {
    const user = await prisma.user.upsert({
      where: { email: EMAIL },
      create: {
        email: EMAIL,
        name: "Load Test User",
        status: "ATIVO",
        emailVerified: new Date(),
      },
      update: { status: "ATIVO" },
    });

    await prisma.usuarioPapel.upsert({
      where: { userId_papel: { userId: user.id, papel: "CLIENTE" } },
      create: { userId: user.id, papel: "CLIENTE" },
      update: {},
    });

    await prisma.consentimento.upsert({
      where: { userId: user.id },
      create: { userId: user.id, versaoTermo: "loadtest" },
      update: {},
    });

    await prisma.session.upsert({
      where: { sessionToken: SESSION_TOKEN },
      create: {
        sessionToken: SESSION_TOKEN,
        userId: user.id,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      update: { expires: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    });

    // Nome do cookie: NextAuth v5 usa "authjs.session-token" sem HTTPS
    // (localhost) e "__Secure-authjs.session-token" com HTTPS. loadtest.env
    // aponta AUTH_URL para http://, então é a variante sem prefixo.
    return { id: user.id, email: user.email, cookies: { "authjs.session-token": SESSION_TOKEN } };
  } finally {
    await prisma.$disconnect();
  }
}

export async function hasAccess(usuario: UsuarioSemeado): Promise<boolean> {
  const prisma = criarPrisma();
  try {
    const user = await prisma.user.findUnique({
      where: { id: usuario.id },
      select: { status: true, consentimento: { select: { id: true } } },
    });
    return user?.status === "ATIVO" && user.consentimento !== null;
  } finally {
    await prisma.$disconnect();
  }
}

export async function seedData(_usuario: UsuarioSemeado): Promise<void> {
  // Nenhum dado extra necessário para o cenário smoke (/login, /feed,
  // /cliente/perfil). Se cobrir /feed com posts reais, crie-os aqui.
}

export async function purgeData(): Promise<void> {
  const prisma = criarPrisma();
  try {
    await prisma.user.deleteMany({ where: { email: EMAIL } });
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
      "Usuário semeado NÃO passa no gate de acesso do middleware — corrija grantAccess()/hasAccess().",
    );
    process.exit(1);
  }

  console.log(JSON.stringify(usuario));
}

main().catch((erro) => {
  console.error("Falha ao semear usuário de teste:", erro);
  process.exit(1);
});
