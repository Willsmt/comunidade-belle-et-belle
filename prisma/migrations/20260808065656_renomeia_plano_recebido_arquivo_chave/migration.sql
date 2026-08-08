/*
  Warnings:

  - You are about to drop the column `arquivoUrl` on the `PlanoRecebido` table. All the data in the column will be lost.
  - Added the required column `arquivoChave` to the `PlanoRecebido` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PlanoRecebido" DROP COLUMN "arquivoUrl",
ADD COLUMN     "arquivoChave" TEXT NOT NULL;
