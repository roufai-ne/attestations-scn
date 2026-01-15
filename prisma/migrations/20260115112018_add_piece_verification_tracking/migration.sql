-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SAISIE', 'AGENT', 'DIRECTEUR', 'ADMIN');

-- CreateEnum
CREATE TYPE "StatutDemande" AS ENUM ('ENREGISTREE', 'EN_TRAITEMENT', 'PIECES_NON_CONFORMES', 'VALIDEE', 'EN_ATTENTE_SIGNATURE', 'SIGNEE', 'REJETEE', 'DELIVREE');

-- CreateEnum
CREATE TYPE "TypePiece" AS ENUM ('DEMANDE_MANUSCRITE', 'CERTIFICAT_ASSIDUITE', 'CERTIFICAT_CESSATION', 'CERTIFICAT_PRISE_SERVICE', 'COPIE_ARRETE');

-- CreateEnum
CREATE TYPE "StatutIndexation" AS ENUM ('EN_ATTENTE', 'EN_COURS', 'INDEXE', 'ERREUR');

-- CreateEnum
CREATE TYPE "CanalNotification" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "StatutNotification" AS ENUM ('EN_ATTENTE', 'ENVOYEE', 'ECHEC');

-- CreateEnum
CREATE TYPE "TypeSignature" AS ENUM ('MANUELLE', 'ELECTRONIQUE');

-- CreateEnum
CREATE TYPE "StatutAttestation" AS ENUM ('GENEREE', 'SIGNEE', 'DELIVREE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demandes" (
    "id" TEXT NOT NULL,
    "numeroEnregistrement" TEXT NOT NULL,
    "dateEnregistrement" TIMESTAMP(3) NOT NULL,
    "statut" "StatutDemande" NOT NULL DEFAULT 'ENREGISTREE',
    "observations" TEXT,
    "motifRejet" TEXT,
    "agentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dateValidation" TIMESTAMP(3),
    "dateSignature" TIMESTAMP(3),

    CONSTRAINT "demandes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appeles" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "dateNaissance" TIMESTAMP(3) NOT NULL,
    "lieuNaissance" TEXT NOT NULL,
    "email" TEXT,
    "telephone" TEXT,
    "whatsapp" TEXT,
    "diplome" TEXT NOT NULL,
    "promotion" TEXT NOT NULL,
    "numeroArrete" TEXT,
    "structure" TEXT,
    "dateDebutService" TIMESTAMP(3) NOT NULL,
    "dateFinService" TIMESTAMP(3) NOT NULL,
    "demandeId" TEXT NOT NULL,

    CONSTRAINT "appeles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pieces_dossier" (
    "id" TEXT NOT NULL,
    "type" "TypePiece" NOT NULL,
    "present" BOOLEAN NOT NULL DEFAULT false,
    "conforme" BOOLEAN,
    "observation" TEXT,
    "statutVerification" TEXT,
    "dateVerification" TIMESTAMP(3),
    "verifiePar" TEXT,
    "demandeId" TEXT NOT NULL,

    CONSTRAINT "pieces_dossier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historique_statuts" (
    "id" TEXT NOT NULL,
    "demandeId" TEXT NOT NULL,
    "statut" "StatutDemande" NOT NULL,
    "commentaire" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiePar" TEXT NOT NULL,

    CONSTRAINT "historique_statuts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arretes" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "dateArrete" TIMESTAMP(3) NOT NULL,
    "promotion" TEXT NOT NULL,
    "annee" TEXT NOT NULL,
    "fichierPath" TEXT NOT NULL,
    "contenuOCR" TEXT,
    "statutIndexation" "StatutIndexation" NOT NULL DEFAULT 'EN_ATTENTE',
    "messageErreur" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateIndexation" TIMESTAMP(3),

    CONSTRAINT "arretes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attestations" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "dateGeneration" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateSignature" TIMESTAMP(3),
    "typeSignature" "TypeSignature",
    "fichierPath" TEXT NOT NULL,
    "qrCodeData" TEXT NOT NULL,
    "statut" "StatutAttestation" NOT NULL DEFAULT 'GENEREE',
    "demandeId" TEXT NOT NULL,
    "signataireId" TEXT,

    CONSTRAINT "attestations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates_attestation" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "fichierPath" TEXT NOT NULL,
    "mappingChamps" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_attestation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "directeur_signatures" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "signatureImage" TEXT NOT NULL,
    "positionX" DOUBLE PRECISION NOT NULL,
    "positionY" DOUBLE PRECISION NOT NULL,
    "texteSignature" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "pinAttempts" INTEGER NOT NULL DEFAULT 0,
    "pinBloqueJusqua" TIMESTAMP(3),
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "directeur_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "demandeId" TEXT NOT NULL,
    "canal" "CanalNotification" NOT NULL,
    "destinataire" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "statut" "StatutNotification" NOT NULL DEFAULT 'EN_ATTENTE',
    "dateEnvoi" TIMESTAMP(3),
    "messageErreur" TEXT,
    "tentatives" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT,
    "demandeId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "config_system" (
    "id" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "valeur" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "config_system_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attestation_counter" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "year" INTEGER NOT NULL,
    "counter" INTEGER NOT NULL,

    CONSTRAINT "attestation_counter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "demandes_numeroEnregistrement_key" ON "demandes"("numeroEnregistrement");

-- CreateIndex
CREATE INDEX "demandes_numeroEnregistrement_idx" ON "demandes"("numeroEnregistrement");

-- CreateIndex
CREATE INDEX "demandes_statut_idx" ON "demandes"("statut");

-- CreateIndex
CREATE INDEX "demandes_agentId_idx" ON "demandes"("agentId");

-- CreateIndex
CREATE INDEX "demandes_dateEnregistrement_idx" ON "demandes"("dateEnregistrement");

-- CreateIndex
CREATE UNIQUE INDEX "appeles_demandeId_key" ON "appeles"("demandeId");

-- CreateIndex
CREATE INDEX "appeles_nom_prenom_idx" ON "appeles"("nom", "prenom");

-- CreateIndex
CREATE INDEX "appeles_promotion_idx" ON "appeles"("promotion");

-- CreateIndex
CREATE INDEX "appeles_numeroArrete_idx" ON "appeles"("numeroArrete");

-- CreateIndex
CREATE INDEX "pieces_dossier_demandeId_idx" ON "pieces_dossier"("demandeId");

-- CreateIndex
CREATE INDEX "historique_statuts_demandeId_idx" ON "historique_statuts"("demandeId");

-- CreateIndex
CREATE INDEX "historique_statuts_createdAt_idx" ON "historique_statuts"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "arretes_numero_key" ON "arretes"("numero");

-- CreateIndex
CREATE INDEX "arretes_numero_idx" ON "arretes"("numero");

-- CreateIndex
CREATE INDEX "arretes_promotion_idx" ON "arretes"("promotion");

-- CreateIndex
CREATE INDEX "arretes_annee_idx" ON "arretes"("annee");

-- CreateIndex
CREATE INDEX "arretes_statutIndexation_idx" ON "arretes"("statutIndexation");

-- CreateIndex
CREATE UNIQUE INDEX "attestations_numero_key" ON "attestations"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "attestations_demandeId_key" ON "attestations"("demandeId");

-- CreateIndex
CREATE INDEX "attestations_numero_idx" ON "attestations"("numero");

-- CreateIndex
CREATE INDEX "attestations_statut_idx" ON "attestations"("statut");

-- CreateIndex
CREATE INDEX "attestations_dateGeneration_idx" ON "attestations"("dateGeneration");

-- CreateIndex
CREATE UNIQUE INDEX "directeur_signatures_userId_key" ON "directeur_signatures"("userId");

-- CreateIndex
CREATE INDEX "notifications_demandeId_idx" ON "notifications"("demandeId");

-- CreateIndex
CREATE INDEX "notifications_statut_idx" ON "notifications"("statut");

-- CreateIndex
CREATE INDEX "notifications_canal_idx" ON "notifications"("canal");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_demandeId_idx" ON "audit_logs"("demandeId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "config_system_cle_key" ON "config_system"("cle");

-- AddForeignKey
ALTER TABLE "demandes" ADD CONSTRAINT "demandes_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appeles" ADD CONSTRAINT "appeles_demandeId_fkey" FOREIGN KEY ("demandeId") REFERENCES "demandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pieces_dossier" ADD CONSTRAINT "pieces_dossier_demandeId_fkey" FOREIGN KEY ("demandeId") REFERENCES "demandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historique_statuts" ADD CONSTRAINT "historique_statuts_demandeId_fkey" FOREIGN KEY ("demandeId") REFERENCES "demandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historique_statuts" ADD CONSTRAINT "historique_statuts_modifiePar_fkey" FOREIGN KEY ("modifiePar") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attestations" ADD CONSTRAINT "attestations_demandeId_fkey" FOREIGN KEY ("demandeId") REFERENCES "demandes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attestations" ADD CONSTRAINT "attestations_signataireId_fkey" FOREIGN KEY ("signataireId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "directeur_signatures" ADD CONSTRAINT "directeur_signatures_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_demandeId_fkey" FOREIGN KEY ("demandeId") REFERENCES "demandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_demandeId_fkey" FOREIGN KEY ("demandeId") REFERENCES "demandes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
