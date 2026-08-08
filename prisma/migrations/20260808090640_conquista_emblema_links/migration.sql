-- AlterTable
ALTER TABLE "Desafio" ADD COLUMN     "emblemaRankingGeralId" TEXT,
ADD COLUMN     "emblemaRankingSemanalId" TEXT;

-- AlterTable
ALTER TABLE "RegraBonus" ADD COLUMN     "emblemaId" TEXT;

-- AddForeignKey
ALTER TABLE "Desafio" ADD CONSTRAINT "Desafio_emblemaRankingSemanalId_fkey" FOREIGN KEY ("emblemaRankingSemanalId") REFERENCES "Emblema"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Desafio" ADD CONSTRAINT "Desafio_emblemaRankingGeralId_fkey" FOREIGN KEY ("emblemaRankingGeralId") REFERENCES "Emblema"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegraBonus" ADD CONSTRAINT "RegraBonus_emblemaId_fkey" FOREIGN KEY ("emblemaId") REFERENCES "Emblema"("id") ON DELETE SET NULL ON UPDATE CASCADE;
