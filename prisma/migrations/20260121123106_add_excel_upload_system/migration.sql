-- AlterTable
ALTER TABLE "arretes" ADD COLUMN     "lieuService" TEXT,
ADD COLUMN     "nombreAppeles" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "fichierPath" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "derniereConnexion" TIMESTAMP(3),
ADD COLUMN     "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lockoutUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "appeles_arretes" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "prenoms" TEXT,
    "dateNaissance" TIMESTAMP(3),
    "lieuNaissance" TEXT,
    "diplome" TEXT,
    "arreteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appeles_arretes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "appeles_arretes_arreteId_idx" ON "appeles_arretes"("arreteId");

-- CreateIndex
CREATE INDEX "appeles_arretes_nom_idx" ON "appeles_arretes"("nom");

-- AddForeignKey
ALTER TABLE "appeles_arretes" ADD CONSTRAINT "appeles_arretes_arreteId_fkey" FOREIGN KEY ("arreteId") REFERENCES "arretes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
