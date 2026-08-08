/*
  Warnings:

  - You are about to drop the column `url` on the `FotoEvolucao` table. All the data in the column will be lost.
  - Added the required column `chave` to the `FotoEvolucao` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FotoEvolucao" DROP COLUMN "url",
ADD COLUMN     "chave" TEXT NOT NULL;
