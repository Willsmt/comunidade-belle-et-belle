-- CreateEnum
CREATE TYPE "FrequenciaItem" AS ENUM ('DIARIO', 'SEMANAL');

-- CreateEnum
CREATE TYPE "TipoBonus" AS ENUM ('LIMIAR_DIARIO', 'COMBO', 'CATEGORIA_COMPLETA');

-- CreateEnum
CREATE TYPE "TipoConquista" AS ENUM ('RANKING_SEMANAL', 'RANKING_GERAL', 'BONUS');

-- CreateTable
CREATE TABLE "Desafio" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "fraseMotivacional" TEXT,
    "dataInicio" DATE NOT NULL,
    "dataFim" DATE NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Desafio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoriaDesafio" (
    "id" TEXT NOT NULL,
    "desafioId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cor" TEXT NOT NULL,

    CONSTRAINT "CategoriaDesafio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemDesafio" (
    "id" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "pontos" INTEGER NOT NULL,
    "frequencia" "FrequenciaItem" NOT NULL DEFAULT 'DIARIO',

    CONSTRAINT "ItemDesafio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarcacaoItem" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarcacaoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegraBonus" (
    "id" TEXT NOT NULL,
    "desafioId" TEXT NOT NULL,
    "tipo" "TipoBonus" NOT NULL,
    "pontosExtras" INTEGER NOT NULL,
    "limiarItens" INTEGER,
    "categoriaId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegraBonus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesafioSurpresa" (
    "id" TEXT NOT NULL,
    "desafioId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "pontos" INTEGER NOT NULL,
    "exigeComprovacao" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesafioSurpresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipacaoSurpresa" (
    "id" TEXT NOT NULL,
    "desafioSurpresaId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "fotoChave" TEXT,
    "validado" BOOLEAN NOT NULL DEFAULT false,
    "validadoPor" TEXT,
    "validadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParticipacaoSurpresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Emblema" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "icone" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Emblema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conquista" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "desafioId" TEXT NOT NULL,
    "emblemaId" TEXT NOT NULL,
    "tipo" "TipoConquista" NOT NULL,
    "referencia" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conquista_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ComboItens" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ComboItens_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Desafio_ativo_idx" ON "Desafio"("ativo");

-- CreateIndex
CREATE INDEX "CategoriaDesafio_desafioId_idx" ON "CategoriaDesafio"("desafioId");

-- CreateIndex
CREATE INDEX "ItemDesafio_categoriaId_idx" ON "ItemDesafio"("categoriaId");

-- CreateIndex
CREATE INDEX "MarcacaoItem_clienteId_data_idx" ON "MarcacaoItem"("clienteId", "data");

-- CreateIndex
CREATE UNIQUE INDEX "MarcacaoItem_itemId_clienteId_data_key" ON "MarcacaoItem"("itemId", "clienteId", "data");

-- CreateIndex
CREATE INDEX "RegraBonus_desafioId_idx" ON "RegraBonus"("desafioId");

-- CreateIndex
CREATE INDEX "DesafioSurpresa_desafioId_idx" ON "DesafioSurpresa"("desafioId");

-- CreateIndex
CREATE UNIQUE INDEX "ParticipacaoSurpresa_desafioSurpresaId_clienteId_key" ON "ParticipacaoSurpresa"("desafioSurpresaId", "clienteId");

-- CreateIndex
CREATE INDEX "Conquista_clienteId_idx" ON "Conquista"("clienteId");

-- CreateIndex
CREATE INDEX "Conquista_desafioId_idx" ON "Conquista"("desafioId");

-- CreateIndex
CREATE INDEX "_ComboItens_B_index" ON "_ComboItens"("B");

-- AddForeignKey
ALTER TABLE "CategoriaDesafio" ADD CONSTRAINT "CategoriaDesafio_desafioId_fkey" FOREIGN KEY ("desafioId") REFERENCES "Desafio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemDesafio" ADD CONSTRAINT "ItemDesafio_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "CategoriaDesafio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarcacaoItem" ADD CONSTRAINT "MarcacaoItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ItemDesafio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarcacaoItem" ADD CONSTRAINT "MarcacaoItem_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegraBonus" ADD CONSTRAINT "RegraBonus_desafioId_fkey" FOREIGN KEY ("desafioId") REFERENCES "Desafio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesafioSurpresa" ADD CONSTRAINT "DesafioSurpresa_desafioId_fkey" FOREIGN KEY ("desafioId") REFERENCES "Desafio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipacaoSurpresa" ADD CONSTRAINT "ParticipacaoSurpresa_desafioSurpresaId_fkey" FOREIGN KEY ("desafioSurpresaId") REFERENCES "DesafioSurpresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipacaoSurpresa" ADD CONSTRAINT "ParticipacaoSurpresa_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conquista" ADD CONSTRAINT "Conquista_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conquista" ADD CONSTRAINT "Conquista_desafioId_fkey" FOREIGN KEY ("desafioId") REFERENCES "Desafio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conquista" ADD CONSTRAINT "Conquista_emblemaId_fkey" FOREIGN KEY ("emblemaId") REFERENCES "Emblema"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ComboItens" ADD CONSTRAINT "_ComboItens_A_fkey" FOREIGN KEY ("A") REFERENCES "ItemDesafio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ComboItens" ADD CONSTRAINT "_ComboItens_B_fkey" FOREIGN KEY ("B") REFERENCES "RegraBonus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
