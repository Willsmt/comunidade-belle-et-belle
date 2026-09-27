-- AlterTable
ALTER TABLE "ItemDesafio" ADD COLUMN     "exigeFoto" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "MarcacaoItem" ADD COLUMN     "fotoChave" TEXT,
ADD COLUMN     "validado" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "validadoEm" TIMESTAMP(3),
ADD COLUMN     "validadoPor" TEXT;
