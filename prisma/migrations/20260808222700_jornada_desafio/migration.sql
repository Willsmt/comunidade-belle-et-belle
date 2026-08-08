-- CreateTable
CREATE TABLE "JornadaDesafio" (
    "id" TEXT NOT NULL,
    "desafioId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "fotoAntesChave" TEXT,
    "fotoDepoisChave" TEXT,
    "reflexaoMudou" TEXT,
    "reflexaoOrgulho" TEXT,
    "reflexaoContinuar" TEXT,
    "avisoEncerramentoVisto" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JornadaDesafio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JornadaDesafio_desafioId_clienteId_key" ON "JornadaDesafio"("desafioId", "clienteId");

-- AddForeignKey
ALTER TABLE "JornadaDesafio" ADD CONSTRAINT "JornadaDesafio_desafioId_fkey" FOREIGN KEY ("desafioId") REFERENCES "Desafio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JornadaDesafio" ADD CONSTRAINT "JornadaDesafio_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
