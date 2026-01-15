import bcrypt from 'bcrypt';
import { PDFDocument } from 'pdf-lib';
import { readFile, writeFile } from 'fs/promises';
import { prisma } from '../prisma';
import path from 'path';

const SALT_ROUNDS = 10;
const MAX_PIN_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Service de gestion de la signature électronique du directeur
 */
export class SignatureService {
    /**
     * Hash un PIN avec bcrypt
     */
    async hashPin(pin: string): Promise<string> {
        return bcrypt.hash(pin, SALT_ROUNDS);
    }

    /**
     * Vérifie un PIN (timing-safe)
     */
    async verifyPin(pin: string, hash: string): Promise<boolean> {
        return bcrypt.compare(pin, hash);
    }

    /**
     * Crée ou met à jour la configuration de signature
     */
    async createOrUpdateConfig(userId: string, data: {
        signatureImagePath: string;
        texteSignature: string;
        pin: string;
        positionX?: number;
        positionY?: number;
    }) {
        const pinHash = await this.hashPin(data.pin);

        const config = await prisma.directeurSignature.upsert({
            where: { userId },
            create: {
                userId,
                signatureImage: data.signatureImagePath,
                texteSignature: data.texteSignature,
                pinHash,
                positionX: data.positionX || 300,
                positionY: data.positionY || 100,
                isEnabled: true,
            },
            update: {
                signatureImage: data.signatureImagePath,
                texteSignature: data.texteSignature,
                pinHash,
                positionX: data.positionX || 300,
                positionY: data.positionY || 100,
                isEnabled: true,
                pinAttempts: 0, // Réinitialiser les tentatives
                pinBloqueJusqua: null,
            },
        });

        return config;
    }

    /**
     * Récupère la configuration de signature
     */
    async getConfig(userId: string) {
        return prisma.directeurSignature.findUnique({
            where: { userId },
        });
    }

    /**
     * Valide le PIN et gère les tentatives/blocage
     */
    async validatePin(userId: string, pin: string): Promise<{
        valid: boolean;
        reason?: string;
        attemptsLeft?: number;
    }> {
        const config = await this.getConfig(userId);

        if (!config) {
            return { valid: false, reason: 'Configuration de signature non trouvée' };
        }

        if (!config.isEnabled) {
            return { valid: false, reason: 'Signature désactivée' };
        }

        // Vérifier si le compte est bloqué
        if (config.pinBloqueJusqua && config.pinBloqueJusqua > new Date()) {
            const minutesLeft = Math.ceil(
                (config.pinBloqueJusqua.getTime() - Date.now()) / 60000
            );
            return {
                valid: false,
                reason: `Compte bloqué. Réessayez dans ${minutesLeft} minute(s)`,
            };
        }

        // Débloquer si le délai est passé
        if (config.pinBloqueJusqua && config.pinBloqueJusqua <= new Date()) {
            await prisma.directeurSignature.update({
                where: { userId },
                data: {
                    pinAttempts: 0,
                    pinBloqueJusqua: null,
                },
            });
        }

        // Vérifier le PIN
        const isValid = await this.verifyPin(pin, config.pinHash);

        if (isValid) {
            // Réinitialiser les tentatives en cas de succès
            await prisma.directeurSignature.update({
                where: { userId },
                data: {
                    pinAttempts: 0,
                    pinBloqueJusqua: null,
                },
            });

            return { valid: true };
        }

        // Incrémenter les tentatives
        const newAttempts = config.pinAttempts + 1;

        if (newAttempts >= MAX_PIN_ATTEMPTS) {
            // Bloquer le compte
            await prisma.directeurSignature.update({
                where: { userId },
                data: {
                    pinAttempts: newAttempts,
                    pinBloqueJusqua: new Date(Date.now() + BLOCK_DURATION_MS),
                },
            });

            return {
                valid: false,
                reason: 'Trop de tentatives. Compte bloqué pour 30 minutes',
            };
        }

        // Incrémenter simplement
        await prisma.directeurSignature.update({
            where: { userId },
            data: {
                pinAttempts: newAttempts,
            },
        });

        return {
            valid: false,
            reason: 'PIN incorrect',
            attemptsLeft: MAX_PIN_ATTEMPTS - newAttempts,
        };
    }

    /**
     * Applique la signature sur un PDF d'attestation
     */
    async applySignatureToPDF(
        attestationId: string,
        userId: string
    ): Promise<void> {
        const config = await this.getConfig(userId);

        if (!config || !config.isEnabled) {
            throw new Error('Configuration de signature invalide');
        }

        // Récupérer l'attestation
        const attestation = await prisma.attestation.findUnique({
            where: { id: attestationId },
        });

        if (!attestation) {
            throw new Error('Attestation introuvable');
        }

        // Charger le PDF existant
        const pdfBytes = await readFile(attestation.fichierPath);
        const pdfDoc = await PDFDocument.load(pdfBytes);

        // Charger l'image de signature
        const signatureImageBytes = await readFile(config.signatureImage);
        const signatureImage = await pdfDoc.embedPng(signatureImageBytes);

        // Obtenir la première page
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];

        // Dimensions de la signature
        const signatureDims = signatureImage.scale(0.3);

        // Appliquer la signature
        firstPage.drawImage(signatureImage, {
            x: config.positionX,
            y: config.positionY,
            width: signatureDims.width,
            height: signatureDims.height,
        });

        // Sauvegarder le PDF modifié
        const modifiedPdfBytes = await pdfDoc.save();
        await writeFile(attestation.fichierPath, modifiedPdfBytes);

        console.log(`✅ Signature appliquée sur l'attestation ${attestation.numero}`);
    }

    /**
     * Signe une attestation
     */
    async signAttestation(attestationId: string, userId: string, pin: string) {
        // Valider le PIN
        const validation = await this.validatePin(userId, pin);

        if (!validation.valid) {
            throw new Error(validation.reason);
        }

        // Vérifier que l'attestation existe et est en attente
        const attestation = await prisma.attestation.findUnique({
            where: { id: attestationId },
        });

        if (!attestation) {
            throw new Error('Attestation introuvable');
        }

        if (attestation.statut === 'SIGNEE') {
            throw new Error('Attestation déjà signée');
        }

        // Appliquer la signature sur le PDF
        await this.applySignatureToPDF(attestationId, userId);

        // Mettre à jour le statut
        const updated = await prisma.attestation.update({
            where: { id: attestationId },
            data: {
                statut: 'SIGNEE',
                dateSignature: new Date(),
                signataireId: userId,
            },
        });

        // Mettre à jour le statut de la demande (SIGNEE après signature)
        await prisma.demande.update({
            where: { id: updated.demandeId },
            data: {
                statut: 'SIGNEE',
                dateSignature: new Date(),
            },
        });

        return updated;
    }

    /**
     * Signe plusieurs attestations en lot
     */
    async signAttestationsLot(
        attestationIds: string[],
        userId: string,
        pin: string
    ) {
        // Valider le PIN une seule fois
        const validation = await this.validatePin(userId, pin);

        if (!validation.valid) {
            throw new Error(validation.reason);
        }

        const results = {
            success: [] as string[],
            errors: [] as { id: string; error: string }[],
        };

        for (const attestationId of attestationIds) {
            try {
                await this.signAttestation(attestationId, userId, pin);
                results.success.push(attestationId);
            } catch (error) {
                results.errors.push({
                    id: attestationId,
                    error: error instanceof Error ? error.message : 'Erreur inconnue',
                });
            }
        }

        return results;
    }
}

export const signatureService = new SignatureService();
