-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "destaque" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Post_destaque_idx" ON "Post"("destaque");
