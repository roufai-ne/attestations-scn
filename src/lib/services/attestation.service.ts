import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { prisma } from '../prisma';
import { qrcodeService } from './qrcode.service';
import { StatutAttestation, TypeSignature } from '@prisma/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface AttestationData {
    demandeId: string;
    nom: string;
    prenom: string;
    dateNaissance: Date;
    lieuNaissance: string;
    diplome: string;
    numeroArrete: string;
    dateDebutService: Date;
    dateFinService: Date;
    promotion: string;
}

/**
 * Service de génération d'attestations PDF
 */
export class AttestationService {
    private readonly uploadDir = path.join(process.cwd(), 'public', 'uploads', 'attestations');
    private readonly templatePath = path.join(process.cwd(), 'public', 'templates', 'attestation-template.pdf');

    /**
     * Génère un numéro d'attestation séquentiel
     * Format: ATT-AAAA-XXXXX
     */
    async generateNumero(): Promise<string> {
        const currentYear = new Date().getFullYear();

        // Utiliser une transaction pour éviter les doublons
        const result = await prisma.$transaction(async (tx) => {
            // Récupérer ou créer le compteur pour l'année en cours
            let counter = await tx.attestationCounter.findUnique({
                where: { id: 'singleton' },
            });

            if (!counter || counter.year !== currentYear) {
                // Nouvelle année ou premier enregistrement
                counter = await tx.attestationCounter.upsert({
                    where: { id: 'singleton' },
                    create: {
                        id: 'singleton',
                        year: currentYear,
                        counter: 1,
                    },
                    update: {
                        year: currentYear,
                        counter: 1,
                    },
                });
            } else {
                // Incrémenter le compteur
                counter = await tx.attestationCounter.update({
                    where: { id: 'singleton' },
                    data: {
                        counter: { increment: 1 },
                    },
                });
            }

            return counter;
        });

        // Formater le numéro: ATT-2026-00001
        const numero = `ATT-${currentYear}-${result.counter.toString().padStart(5, '0')}`;
        return numero;
    }

    /**
     * Génère une attestation PDF
     */
    async generateAttestation(data: AttestationData): Promise<{
        numero: string;
        fichierPath: string;
        qrCodeData: string;
    }> {
        try {
            // Créer le dossier d'upload s'il n'existe pas
            await mkdir(this.uploadDir, { recursive: true });

            // Générer le numéro d'attestation
            const numero = await this.generateNumero();

            // Charger le template PDF (ou créer un PDF vierge si pas de template)
            let pdfDoc: PDFDocument;
            try {
                const templateBytes = await readFile(this.templatePath);
                pdfDoc = await PDFDocument.load(templateBytes);
            } catch (error) {
                console.warn('Template PDF non trouvé, création d\'un PDF vierge');
                pdfDoc = await PDFDocument.create();
                const page = pdfDoc.addPage([595, 842]); // A4

                // Ajouter un titre simple
                const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
                page.drawText('ATTESTATION DE SERVICE CIVIQUE NATIONAL', {
                    x: 50,
                    y: 750,
                    size: 16,
                    font,
                    color: rgb(0, 0, 0),
                });
            }

            // Obtenir la première page
            const pages = pdfDoc.getPages();
            const firstPage = pages[0];

            // Charger les polices
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            // Remplir les champs (positions à ajuster selon le template réel)
            const fontSize = 12;
            let yPosition = 650;

            // Numéro d'attestation
            firstPage.drawText(`N° ${numero}`, {
                x: 400,
                y: yPosition,
                size: 10,
                font: fontBold,
            });

            yPosition -= 80;

            // Informations de l'appelé
            firstPage.drawText(`Nom : ${data.nom}`, {
                x: 50,
                y: yPosition,
                size: fontSize,
                font,
            });

            yPosition -= 25;
            firstPage.drawText(`Prénom : ${data.prenom}`, {
                x: 50,
                y: yPosition,
                size: fontSize,
                font,
            });

            yPosition -= 25;
            firstPage.drawText(
                `Né(e) le : ${format(data.dateNaissance, 'dd MMMM yyyy', { locale: fr })} à ${data.lieuNaissance}`,
                {
                    x: 50,
                    y: yPosition,
                    size: fontSize,
                    font,
                }
            );

            yPosition -= 25;
            firstPage.drawText(`Diplôme : ${data.diplome}`, {
                x: 50,
                y: yPosition,
                size: fontSize,
                font,
            });

            yPosition -= 40;
            firstPage.drawText('A effectué son Service Civique National :', {
                x: 50,
                y: yPosition,
                size: fontSize,
                font: fontBold,
            });

            yPosition -= 25;
            firstPage.drawText(`Arrêté N° : ${data.numeroArrete}`, {
                x: 50,
                y: yPosition,
                size: fontSize,
                font,
            });

            yPosition -= 25;
            firstPage.drawText(`Promotion : ${data.promotion}`, {
                x: 50,
                y: yPosition,
                size: fontSize,
                font,
            });

            yPosition -= 25;
            firstPage.drawText(
                `Période : du ${format(data.dateDebutService, 'dd/MM/yyyy')} au ${format(data.dateFinService, 'dd/MM/yyyy')}`,
                {
                    x: 50,
                    y: yPosition,
                    size: fontSize,
                    font,
                }
            );

            // Générer le QR Code
            const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
            const qrCodeBuffer = await qrcodeService.generateQRCodeBuffer(
                {
                    id: data.demandeId,
                    numero,
                    nom: data.nom,
                    prenom: data.prenom,
                    dateNaissance: format(data.dateNaissance, 'yyyy-MM-dd'),
                },
                baseUrl
            );

            // Embed QR Code dans le PDF
            const qrImage = await pdfDoc.embedPng(qrCodeBuffer);
            const qrDims = qrImage.scale(0.5);

            firstPage.drawImage(qrImage, {
                x: firstPage.getWidth() - qrDims.width - 50,
                y: 50,
                width: qrDims.width,
                height: qrDims.height,
            });

            // Texte sous le QR Code
            firstPage.drawText('Scannez pour vérifier', {
                x: firstPage.getWidth() - qrDims.width - 50,
                y: 35,
                size: 8,
                font,
            });

            // Date de délivrance
            firstPage.drawText(`Fait à Niamey, le ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`, {
                x: 50,
                y: 150,
                size: fontSize,
                font,
            });

            // Signature
            firstPage.drawText('Le Directeur du Service Civique National', {
                x: 300,
                y: 120,
                size: fontSize,
                font: fontBold,
            });

            // Sauvegarder le PDF
            const pdfBytes = await pdfDoc.save();
            const filename = `${numero}.pdf`;
            const fichierPath = path.join(this.uploadDir, filename);

            await writeFile(fichierPath, pdfBytes);

            console.log(`✅ Attestation générée: ${numero}`);

            // Générer les données QR pour stockage
            const qrCodeData = qrcodeService.generateQRData({
                id: data.demandeId,
                numero,
                nom: data.nom,
                prenom: data.prenom,
                dateNaissance: format(data.dateNaissance, 'yyyy-MM-dd'),
            });

            return {
                numero,
                fichierPath,
                qrCodeData,
            };
        } catch (error) {
            console.error('Erreur lors de la génération de l\'attestation:', error);
            throw new Error('Impossible de générer l\'attestation');
        }
    }

    /**
     * Crée l'enregistrement d'attestation en base de données
     */
    async createAttestation(demandeId: string, data: AttestationData) {
        const { numero, fichierPath, qrCodeData } = await this.generateAttestation(data);

        const attestation = await prisma.attestation.create({
            data: {
                numero,
                fichierPath,
                qrCodeData,
                demandeId,
                statut: StatutAttestation.GENEREE,
            },
        });

        // Mettre à jour le statut de la demande
        await prisma.demande.update({
            where: { id: demandeId },
            data: {
                statut: 'EN_ATTENTE_SIGNATURE',
            },
        });

        return attestation;
    }

    /**
     * Récupère une attestation par son numéro
     */
    async getAttestationByNumero(numero: string) {
        return prisma.attestation.findUnique({
            where: { numero },
            include: {
                demande: {
                    include: {
                        appele: true,
                    },
                },
            },
        });
    }

    /**
     * Valide une attestation via son QR Code
     */
    async validateAttestation(numero: string, signature: string, timestamp: number) {
        const attestation = await this.getAttestationByNumero(numero);

        if (!attestation) {
            return { valid: false, reason: 'Attestation introuvable' };
        }

        // Parser et valider les données QR
        const validation = qrcodeService.parseAndValidateQRData(attestation.qrCodeData);

        if (!validation.valid) {
            return { valid: false, reason: validation.reason };
        }

        // Vérifier que la signature correspond
        if (validation.data?.signature !== signature) {
            return { valid: false, reason: 'Signature invalide' };
        }

        return {
            valid: true,
            attestation: {
                numero: attestation.numero,
                nom: attestation.demande.appele?.nom,
                prenom: attestation.demande.appele?.prenom,
                dateNaissance: attestation.demande.appele?.dateNaissance,
                diplome: attestation.demande.appele?.diplome,
                promotion: attestation.demande.appele?.promotion,
                dateGeneration: attestation.dateGeneration,
                statut: attestation.statut,
            },
        };
    }
}

export const attestationService = new AttestationService();
