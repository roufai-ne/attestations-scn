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
        signatureWidth?: number;
        signatureHeight?: number;
        qrCodePositionX?: number;
        qrCodePositionY?: number;
        qrCodeSize?: number;
    }) {
        const pinHash = await this.hashPin(data.pin);

        const config = await prisma.directeurSignature.upsert({
            where: { userId },
            create: {
                userId,
                signatureImage: data.signatureImagePath,
                texteSignature: data.texteSignature,
                pinHash,
                positionX: data.positionX || 500,
                positionY: data.positionY || 100,
                signatureWidth: data.signatureWidth || 150,
                signatureHeight: data.signatureHeight || 60,
                qrCodePositionX: data.qrCodePositionX || 50,
                qrCodePositionY: data.qrCodePositionY || 500,
                qrCodeSize: data.qrCodeSize || 80,
                isEnabled: true,
            },
            update: {
                signatureImage: data.signatureImagePath,
                texteSignature: data.texteSignature,
                pinHash,
                positionX: data.positionX || 500,
                positionY: data.positionY || 100,
                signatureWidth: data.signatureWidth || 150,
                signatureHeight: data.signatureHeight || 60,
                qrCodePositionX: data.qrCodePositionX || 50,
                qrCodePositionY: data.qrCodePositionY || 500,
                qrCodeSize: data.qrCodeSize || 80,
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
     * Applique la signature et le QR code sur un PDF d'attestation
     * Utilise les positions configurées par le directeur
     */
    async applySignatureToPDF(
        attestationId: string,
        userId: string
    ): Promise<void> {
        const config = await this.getConfig(userId);

        if (!config || !config.isEnabled) {
            throw new Error('Configuration de signature invalide');
        }

        // Récupérer l'attestation avec les détails de la demande et de l'appelé
        const attestation = await prisma.attestation.findUnique({
            where: { id: attestationId },
            include: {
                demande: {
                    include: {
                        appele: true,
                    },
                },
            },
        });

        if (!attestation) {
            throw new Error('Attestation introuvable');
        }

        const appele = attestation.demande?.appele;

        // Construire le chemin du fichier
        const pdfPath = attestation.fichierPath.startsWith('/')
            ? path.join(process.cwd(), 'public', attestation.fichierPath)
            : attestation.fichierPath;

        // Charger le PDF existant
        const pdfBytes = await readFile(pdfPath);
        const pdfDoc = await PDFDocument.load(pdfBytes);

        // Obtenir la première page
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const pageHeight = firstPage.getHeight();

        // 1. Appliquer la SIGNATURE à la position configurée
        const signaturePath = config.signatureImage.startsWith('/')
            ? path.join(process.cwd(), 'public', config.signatureImage)
            : config.signatureImage;

        const signatureImageBytes = await readFile(signaturePath);
        const signatureImage = config.signatureImage.endsWith('.png')
            ? await pdfDoc.embedPng(signatureImageBytes)
            : await pdfDoc.embedJpg(signatureImageBytes);

        // Dimensions de la signature (utiliser les valeurs configurées ou défaut)
        const sigWidth = (config as any).signatureWidth || 150;
        const sigHeight = (config as any).signatureHeight || 60;

        // Note: Les coordonnées Y sont inversées en PDF (origine en bas)
        firstPage.drawImage(signatureImage, {
            x: config.positionX,
            y: pageHeight - config.positionY - sigHeight,
            width: sigWidth,
            height: sigHeight,
        });

        // 2. Appliquer le QR CODE à la position configurée
        const { qrcodeService } = await import('./qrcode.service');
        const { format } = await import('date-fns');

        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const qrCodeBuffer = await qrcodeService.generateQRCodeBuffer(
            {
                id: attestation.demandeId,
                numero: attestation.numero,
                nom: appele?.nom || '',
                prenom: appele?.prenom || '',
                dateNaissance: appele?.dateNaissance
                    ? format(appele.dateNaissance, 'yyyy-MM-dd')
                    : '',
            },
            baseUrl
        );

        const qrImage = await pdfDoc.embedPng(qrCodeBuffer);
        const qrSize = (config as any).qrCodeSize || 80;

        firstPage.drawImage(qrImage, {
            x: (config as any).qrCodePositionX || 50,
            y: pageHeight - ((config as any).qrCodePositionY || 50) - qrSize,
            width: qrSize,
            height: qrSize,
        });

        // Sauvegarder le PDF modifié
        const modifiedPdfBytes = await pdfDoc.save();
        await writeFile(pdfPath, modifiedPdfBytes);

        console.log(`✅ Signature et QR code appliqués sur l'attestation ${attestation.numero}`);
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

    /**
     * Change le PIN du directeur
     */
    async changerPin(userId: string, ancienPin: string, nouveauPin: string): Promise<{
        success: boolean;
        message: string;
    }> {
        // Valider l'ancien PIN
        const validation = await this.validatePin(userId, ancienPin);

        if (!validation.valid) {
            return { success: false, message: validation.reason || 'PIN incorrect' };
        }

        // Hasher le nouveau PIN
        const nouveauPinHash = await this.hashPin(nouveauPin);

        // Mettre à jour
        await prisma.directeurSignature.update({
            where: { userId },
            data: {
                pinHash: nouveauPinHash,
                pinAttempts: 0,
                pinBloqueJusqua: null,
            },
        });

        // Logger l'action
        await prisma.auditLog.create({
            data: {
                action: 'PIN_CHANGED',
                userId,
                details: JSON.stringify({ timestamp: new Date().toISOString() }),
            },
        });

        return { success: true, message: 'PIN modifié avec succès' };
    }

    /**
     * Débloquer le PIN (Admin uniquement)
     */
    async debloquerPin(userId: string, adminId: string): Promise<{
        success: boolean;
        message: string;
    }> {
        const config = await this.getConfig(userId);

        if (!config) {
            return { success: false, message: 'Configuration de signature non trouvée' };
        }

        // Réinitialiser les tentatives et le blocage
        await prisma.directeurSignature.update({
            where: { userId },
            data: {
                pinAttempts: 0,
                pinBloqueJusqua: null,
            },
        });

        // Logger l'action
        await prisma.auditLog.create({
            data: {
                action: 'PIN_UNLOCKED',
                userId: adminId,
                details: JSON.stringify({
                    targetUserId: userId,
                    timestamp: new Date().toISOString(),
                }),
            },
        });

        return { success: true, message: 'PIN débloqué avec succès' };
    }

    /**
     * Révoquer la signature (Admin uniquement)
     */
    async revoquerSignature(userId: string, adminId: string): Promise<{
        success: boolean;
        message: string;
    }> {
        const config = await this.getConfig(userId);

        if (!config) {
            return { success: false, message: 'Configuration de signature non trouvée' };
        }

        // Désactiver la signature
        await prisma.directeurSignature.update({
            where: { userId },
            data: {
                isEnabled: false,
            },
        });

        // Logger l'action
        await prisma.auditLog.create({
            data: {
                action: 'SIGNATURE_REVOKED',
                userId: adminId,
                details: JSON.stringify({
                    targetUserId: userId,
                    timestamp: new Date().toISOString(),
                }),
            },
        });

        return { success: true, message: 'Signature révoquée avec succès' };
    }

    /**
     * Réactiver la signature (Admin uniquement)
     */
    async reactiverSignature(userId: string, adminId: string): Promise<{
        success: boolean;
        message: string;
    }> {
        const config = await this.getConfig(userId);

        if (!config) {
            return { success: false, message: 'Configuration de signature non trouvée' };
        }

        // Réactiver la signature
        await prisma.directeurSignature.update({
            where: { userId },
            data: {
                isEnabled: true,
                pinAttempts: 0,
                pinBloqueJusqua: null,
            },
        });

        // Logger l'action
        await prisma.auditLog.create({
            data: {
                action: 'SIGNATURE_REACTIVATED',
                userId: adminId,
                details: JSON.stringify({
                    targetUserId: userId,
                    timestamp: new Date().toISOString(),
                }),
            },
        });

        return { success: true, message: 'Signature réactivée avec succès' };
    }

    /**
     * Obtenir l'historique des signatures d'un directeur
     */
    async getHistoriqueSignatures(userId: string, options?: {
        dateDebut?: Date;
        dateFin?: Date;
        page?: number;
        limit?: number;
    }) {
        const { dateDebut, dateFin, page = 1, limit = 20 } = options || {};

        const where: any = {
            signataireId: userId,
            statut: 'SIGNEE',
        };

        if (dateDebut || dateFin) {
            where.dateSignature = {};
            if (dateDebut) where.dateSignature.gte = dateDebut;
            if (dateFin) where.dateSignature.lte = dateFin;
        }

        const [attestations, total] = await Promise.all([
            prisma.attestation.findMany({
                where,
                include: {
                    demande: {
                        include: {
                            appele: {
                                select: {
                                    nom: true,
                                    prenom: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { dateSignature: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.attestation.count({ where }),
        ]);

        return {
            attestations,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Obtenir les statistiques de signatures
     */
    async getStatistiquesSignatures(userId: string, periode?: {
        dateDebut: Date;
        dateFin: Date;
    }) {
        const where: any = {
            signataireId: userId,
            statut: 'SIGNEE',
        };

        if (periode) {
            where.dateSignature = {
                gte: periode.dateDebut,
                lte: periode.dateFin,
            };
        }

        const [totalSignees, parMois] = await Promise.all([
            prisma.attestation.count({ where }),
            prisma.attestation.groupBy({
                by: ['dateSignature'],
                where,
                _count: true,
            }),
        ]);

        // Grouper par mois
        const parMoisMap = new Map<string, number>();
        parMois.forEach((item) => {
            if (item.dateSignature) {
                const key = `${item.dateSignature.getFullYear()}-${String(item.dateSignature.getMonth() + 1).padStart(2, '0')}`;
                parMoisMap.set(key, (parMoisMap.get(key) || 0) + item._count);
            }
        });

        return {
            totalSignees,
            parMois: Object.fromEntries(parMoisMap),
        };
    }
}

export const signatureService = new SignatureService();
