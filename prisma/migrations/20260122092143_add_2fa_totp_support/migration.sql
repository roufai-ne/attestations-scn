-- AlterTable
ALTER TABLE "directeur_signatures" ADD COLUMN     "totpBackupCodes" TEXT,
ADD COLUMN     "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totpSecret" TEXT,
ADD COLUMN     "twoFactorMethod" TEXT NOT NULL DEFAULT 'email';
