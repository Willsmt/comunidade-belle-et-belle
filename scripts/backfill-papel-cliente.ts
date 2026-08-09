import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const usuarios = await prisma.user.findMany({
    where: { status: "ATIVO", papeis: { none: {} } },
    select: { id: true, name: true, email: true },
  });

  if (usuarios.length === 0) {
    console.log("Nenhuma conta ATIVO sem papel encontrada. Nada a fazer.");
    return;
  }

  for (const usuario of usuarios) {
    await prisma.usuarioPapel.upsert({
      where: { userId_papel: { userId: usuario.id, papel: "CLIENTE" } },
      create: { userId: usuario.id, papel: "CLIENTE" },
      update: {},
    });
    console.log(
      `CLIENTE atribuído: ${usuario.id} (${usuario.name ?? usuario.email})`,
    );
  }

  console.log(
    `Concluído: ${usuarios.length} conta(s) receberam o papel CLIENTE.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
