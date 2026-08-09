-- CreateTable
CREATE TABLE "PerfilParceria" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "especialidade" TEXT,
    "bio" TEXT,
    "fotoChave" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerfilParceria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PerfilParceria_usuarioId_key" ON "PerfilParceria"("usuarioId");

-- AddForeignKey
ALTER TABLE "PerfilParceria" ADD CONSTRAINT "PerfilParceria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
