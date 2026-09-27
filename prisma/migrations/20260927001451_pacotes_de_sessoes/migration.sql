-- CreateTable
CREATE TABLE "TipoSessao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TipoSessao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoPacote" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TipoPacote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemTipoPacote" (
    "id" TEXT NOT NULL,
    "tipoPacoteId" TEXT NOT NULL,
    "tipoSessaoId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,

    CONSTRAINT "ItemTipoPacote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CicloPacote" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "tipoPacoteId" TEXT NOT NULL,
    "nomePacote" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "arquivadoEm" TIMESTAMP(3),

    CONSTRAINT "CicloPacote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemCicloPacote" (
    "id" TEXT NOT NULL,
    "cicloPacoteId" TEXT NOT NULL,
    "tipoSessaoId" TEXT NOT NULL,
    "quantidadeContratada" INTEGER NOT NULL,

    CONSTRAINT "ItemCicloPacote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessaoRealizada" (
    "id" TEXT NOT NULL,
    "cicloPacoteId" TEXT NOT NULL,
    "tipoSessaoId" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "marcadoPorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessaoRealizada_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TipoSessao_nome_key" ON "TipoSessao"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "ItemTipoPacote_tipoPacoteId_tipoSessaoId_key" ON "ItemTipoPacote"("tipoPacoteId", "tipoSessaoId");

-- CreateIndex
CREATE INDEX "CicloPacote_clienteId_ativo_idx" ON "CicloPacote"("clienteId", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "ItemCicloPacote_cicloPacoteId_tipoSessaoId_key" ON "ItemCicloPacote"("cicloPacoteId", "tipoSessaoId");

-- CreateIndex
CREATE INDEX "SessaoRealizada_cicloPacoteId_tipoSessaoId_idx" ON "SessaoRealizada"("cicloPacoteId", "tipoSessaoId");

-- AddForeignKey
ALTER TABLE "ItemTipoPacote" ADD CONSTRAINT "ItemTipoPacote_tipoPacoteId_fkey" FOREIGN KEY ("tipoPacoteId") REFERENCES "TipoPacote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemTipoPacote" ADD CONSTRAINT "ItemTipoPacote_tipoSessaoId_fkey" FOREIGN KEY ("tipoSessaoId") REFERENCES "TipoSessao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CicloPacote" ADD CONSTRAINT "CicloPacote_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CicloPacote" ADD CONSTRAINT "CicloPacote_tipoPacoteId_fkey" FOREIGN KEY ("tipoPacoteId") REFERENCES "TipoPacote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemCicloPacote" ADD CONSTRAINT "ItemCicloPacote_cicloPacoteId_fkey" FOREIGN KEY ("cicloPacoteId") REFERENCES "CicloPacote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemCicloPacote" ADD CONSTRAINT "ItemCicloPacote_tipoSessaoId_fkey" FOREIGN KEY ("tipoSessaoId") REFERENCES "TipoSessao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessaoRealizada" ADD CONSTRAINT "SessaoRealizada_cicloPacoteId_fkey" FOREIGN KEY ("cicloPacoteId") REFERENCES "CicloPacote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessaoRealizada" ADD CONSTRAINT "SessaoRealizada_tipoSessaoId_fkey" FOREIGN KEY ("tipoSessaoId") REFERENCES "TipoSessao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessaoRealizada" ADD CONSTRAINT "SessaoRealizada_marcadoPorId_fkey" FOREIGN KEY ("marcadoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
