-- CreateEnum
CREATE TYPE "TipoPlano" AS ENUM ('TREINO', 'DIETA');

-- CreateTable
CREATE TABLE "Perfil" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "bioPublica" BOOLEAN NOT NULL DEFAULT false,
    "emblemasPublicos" BOOLEAN NOT NULL DEFAULT true,
    "medidasPublicas" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Perfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroMedida" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "peso" DECIMAL(5,2),
    "cintura" DECIMAL(5,2),
    "quadril" DECIMAL(5,2),
    "braco" DECIMAL(5,2),
    "coxa" DECIMAL(5,2),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistroMedida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FotoEvolucao" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publica" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FotoEvolucao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VinculoParceria" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "parceriaId" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoPorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VinculoParceria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanoRecebido" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "parceriaId" TEXT NOT NULL,
    "tipo" "TipoPlano" NOT NULL,
    "titulo" TEXT,
    "arquivoUrl" TEXT NOT NULL,
    "enviadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanoRecebido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Perfil_userId_key" ON "Perfil"("userId");

-- CreateIndex
CREATE INDEX "RegistroMedida_clienteId_data_idx" ON "RegistroMedida"("clienteId", "data");

-- CreateIndex
CREATE INDEX "FotoEvolucao_clienteId_data_idx" ON "FotoEvolucao"("clienteId", "data");

-- CreateIndex
CREATE INDEX "VinculoParceria_parceriaId_ativo_idx" ON "VinculoParceria"("parceriaId", "ativo");

-- CreateIndex
CREATE INDEX "VinculoParceria_clienteId_ativo_idx" ON "VinculoParceria"("clienteId", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "VinculoParceria_clienteId_parceriaId_key" ON "VinculoParceria"("clienteId", "parceriaId");

-- CreateIndex
CREATE INDEX "PlanoRecebido_clienteId_enviadoEm_idx" ON "PlanoRecebido"("clienteId", "enviadoEm");

-- AddForeignKey
ALTER TABLE "Perfil" ADD CONSTRAINT "Perfil_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroMedida" ADD CONSTRAINT "RegistroMedida_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FotoEvolucao" ADD CONSTRAINT "FotoEvolucao_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VinculoParceria" ADD CONSTRAINT "VinculoParceria_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VinculoParceria" ADD CONSTRAINT "VinculoParceria_parceriaId_fkey" FOREIGN KEY ("parceriaId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanoRecebido" ADD CONSTRAINT "PlanoRecebido_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanoRecebido" ADD CONSTRAINT "PlanoRecebido_parceriaId_fkey" FOREIGN KEY ("parceriaId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
