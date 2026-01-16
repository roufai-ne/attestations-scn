import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { prisma } from '../prisma';
import { qrcodeService } from './qrcode.service';
import { templateService, TemplateConfig, TemplateField } from './template.service';
import { StatutAttestation, TypeSignature } from '@prisma/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface AttestationData {
    demandeId: string;
    nom: string;
    prenom: string;
    civilite?: string;
    dateNaissance: Date;
    lieuNaissance: string;
    diplome: string;
    numeroArrete: string;
    dateDebutService: Date;
    dateFinService: Date;
    promotion: string;
    lieuService?: string;
}

/**
 * Service de génération d'attestations PDF
 * Utilise le template actif configuré via l'éditeur visuel
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
     * Récupère la valeur d'un champ à partir des données
     */
    private getFieldValue(data: AttestationData, field: TemplateField, numero: string): string {
        const now = new Date();

        switch (field.id) {
            case 'numero':
                return numero;
            case 'civilite':
                return data.civilite || 'M.';
            case 'prenomNom':
                return `${data.prenom} ${data.nom}`;
            case 'dateNaissance':
                return format(data.dateNaissance, field.format || 'dd MMMM yyyy', { locale: fr });
            case 'lieuNaissance':
                return data.lieuNaissance;
            case 'diplome':
                return data.diplome;
            case 'lieuService':
                return data.lieuService || 'Direction du Service Civique National';
            case 'dateDebutService':
                return format(data.dateDebutService, field.format || 'dd/MM/yyyy');
            case 'dateFinService':
                return format(data.dateFinService, field.format || 'dd/MM/yyyy');
            case 'dateSignature':
                return format(now, field.format || 'dd MMMM yyyy', { locale: fr });
            case 'nomDirecteur':
                return 'Dr. DOUMA SOUMANA M.C';
            case 'promotion':
                return data.promotion;
            case 'numeroArrete':
                return data.numeroArrete;
            default:
                return '';
        }
    }

    /**
     * Convertit une couleur hex en RGB pour pdf-lib
     */
    private hexToRgb(hex: string): { r: number; g: number; b: number } {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? {
                r: parseInt(result[1], 16) / 255,
                g: parseInt(result[2], 16) / 255,
                b: parseInt(result[3], 16) / 255,
            }
            : { r: 0, g: 0, b: 0 };
    }

    /**
     * Obtient la police PDF correspondante
     */
    private async getFont(
        pdfDoc: PDFDocument,
        fontFamily: string,
        fontWeight: string
    ): Promise<PDFFont> {
        const fontMap: Record<string, typeof StandardFonts[keyof typeof StandardFonts]> = {
            'Helvetica-normal': StandardFonts.Helvetica,
            'Helvetica-bold': StandardFonts.HelveticaBold,
            'Times-normal': StandardFonts.TimesRoman,
            'Times-bold': StandardFonts.TimesRomanBold,
            'Courier-normal': StandardFonts.Courier,
            'Courier-bold': StandardFonts.CourierBold,
        };

        const key = `${fontFamily}-${fontWeight}`;
        const standardFont = fontMap[key] || StandardFonts.Helvetica;
        return pdfDoc.embedFont(standardFont);
    }

    /**
     * Dessine un champ sur la page PDF
     */
    private async drawField(
        pdfDoc: PDFDocument,
        page: PDFPage,
        field: TemplateField,
        value: string,
        fonts: Map<string, PDFFont>
    ): Promise<void> {
        if (field.type === 'qrcode' || field.type === 'signature') {
            return; // Géré séparément
        }

        const fontKey = `${field.fontFamily}-${field.fontWeight}`;
        let font = fonts.get(fontKey);
        if (!font) {
            font = await this.getFont(pdfDoc, field.fontFamily, field.fontWeight);
            fonts.set(fontKey, font);
        }

        const color = this.hexToRgb(field.color);
        const text = `${field.prefix || ''}${value}${field.suffix || ''}`;

        // Note: Dans PDF, Y=0 est en bas, mais notre éditeur utilise Y=0 en haut
        // Convertir Y: pageHeight - fieldY
        const pageHeight = page.getHeight();
        const pdfY = pageHeight - field.y - field.fontSize;

        page.drawText(text, {
            x: field.x,
            y: pdfY,
            size: field.fontSize,
            font,
            color: rgb(color.r, color.g, color.b),
        });
    }

    /**
     * Génère une attestation PDF en utilisant le template actif
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

            // Récupérer le template actif
            const template = await templateService.getActive();
            let config: TemplateConfig | null = null;

            if (template) {
                config = templateService.parseConfig(template);
            }

            // Créer le PDF
            let pdfDoc: PDFDocument;
            let page: PDFPage;

            if (config && config.backgroundImage) {
                // Créer un PDF avec l'image de fond
                pdfDoc = await PDFDocument.create();

                // Charger l'image de fond
                const bgPath = path.join(process.cwd(), 'public', config.backgroundImage);
                try {
                    const bgBytes = await readFile(bgPath);
                    const bgImage = config.backgroundImage.endsWith('.png')
                        ? await pdfDoc.embedPng(bgBytes)
                        : await pdfDoc.embedJpg(bgBytes);

                    // Créer la page avec les bonnes dimensions
                    const pageWidth = config.pageWidth || 842;
                    const pageHeight = config.pageHeight || 595;
                    page = pdfDoc.addPage([pageWidth, pageHeight]);

                    // Dessiner l'image de fond
                    page.drawImage(bgImage, {
                        x: 0,
                        y: 0,
                        width: pageWidth,
                        height: pageHeight,
                    });
                } catch (err) {
                    console.warn('Erreur chargement image de fond:', err);
                    page = pdfDoc.addPage([config.pageWidth || 842, config.pageHeight || 595]);
                }
            } else {
                // Fallback: PDF vierge classique
                pdfDoc = await PDFDocument.create();
                page = pdfDoc.addPage([842, 595]); // A4 paysage par défaut
            }

            // Cache des polices
            const fonts = new Map<string, PDFFont>();

            // Dessiner les champs configurés
            if (config && config.fields.length > 0) {
                for (const field of config.fields) {
                    if (field.type === 'qrcode') {
                        // Générer et placer le QR Code
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

                        const qrImage = await pdfDoc.embedPng(qrCodeBuffer);
                        const qrWidth = field.width || 80;
                        const qrHeight = field.height || 80;
                        const pageHeight = page.getHeight();

                        page.drawImage(qrImage, {
                            x: field.x,
                            y: pageHeight - field.y - qrHeight,
                            width: qrWidth,
                            height: qrHeight,
                        });
                    } else if (field.type === 'signature') {
                        // Charger la signature du directeur si configurée
                        const signatureConfig = await prisma.directeurSignature.findFirst({
                            where: { isEnabled: true },
                        });

                        if (signatureConfig?.signatureImage) {
                            try {
                                const sigPath = path.join(process.cwd(), 'public', signatureConfig.signatureImage);
                                const sigBytes = await readFile(sigPath);
                                const sigImage = signatureConfig.signatureImage.endsWith('.png')
                                    ? await pdfDoc.embedPng(sigBytes)
                                    : await pdfDoc.embedJpg(sigBytes);

                                const sigWidth = field.width || 150;
                                const sigHeight = field.height || 60;
                                const pageHeight = page.getHeight();

                                page.drawImage(sigImage, {
                                    x: field.x,
                                    y: pageHeight - field.y - sigHeight,
                                    width: sigWidth,
                                    height: sigHeight,
                                });
                            } catch (err) {
                                console.warn('Erreur chargement signature:', err);
                            }
                        }
                    } else {
                        // Champ texte ou date
                        const value = this.getFieldValue(data, field, numero);
                        await this.drawField(pdfDoc, page, field, value, fonts);
                    }
                }
            } else {
                // Fallback: génération classique si pas de template configuré
                await this.generateClassicAttestation(pdfDoc, page, data, numero);
            }

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
                fichierPath: `/uploads/attestations/${filename}`,
                qrCodeData,
            };
        } catch (error) {
            console.error('Erreur lors de la génération de l\'attestation:', error);
            throw new Error('Impossible de générer l\'attestation');
        }
    }

    /**
     * Génération classique (fallback si pas de template)
     */
    private async generateClassicAttestation(
        pdfDoc: PDFDocument,
        page: PDFPage,
        data: AttestationData,
        numero: string
    ): Promise<void> {
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const fontSize = 12;
        let yPosition = page.getHeight() - 100;

        // Titre
        page.drawText('ATTESTATION DE SERVICE CIVIQUE NATIONAL', {
            x: 200,
            y: yPosition,
            size: 16,
            font: fontBold,
        });

        yPosition -= 50;

        // Numéro
        page.drawText(`N° ${numero}`, {
            x: 600,
            y: yPosition,
            size: 10,
            font: fontBold,
        });

        yPosition -= 40;

        // Informations
        const lines = [
            `${data.civilite || 'M./Mme/Mlle'} ${data.prenom} ${data.nom}`,
            `Né(e) le ${format(data.dateNaissance, 'dd MMMM yyyy', { locale: fr })} à ${data.lieuNaissance}`,
            `Titulaire d'${data.diplome}`,
            '',
            `A accompli avec assiduité le Service Civique National`,
            `à/au ${data.lieuService || 'Direction du Service Civique National'}`,
            '',
            `Durant la période du ${format(data.dateDebutService, 'dd/MM/yyyy')} au ${format(data.dateFinService, 'dd/MM/yyyy')}`,
        ];

        for (const line of lines) {
            page.drawText(line, {
                x: 50,
                y: yPosition,
                size: fontSize,
                font: line === '' ? font : line.includes('accompli') ? fontBold : font,
            });
            yPosition -= 25;
        }

        // Date et signature
        page.drawText(`Niamey, le ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`, {
            x: 500,
            y: 150,
            size: fontSize,
            font,
        });

        page.drawText('Le Directeur', {
            x: 550,
            y: 120,
            size: fontSize,
            font: fontBold,
        });

        // QR Code
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

        const qrImage = await pdfDoc.embedPng(qrCodeBuffer);
        page.drawImage(qrImage, {
            x: 50,
            y: 50,
            width: 80,
            height: 80,
        });

        page.drawText('Scannez pour vérifier', {
            x: 50,
            y: 35,
            size: 8,
            font,
        });
    }

    /**
     * Crée l'enregistrement d'attestation en base de données
     */
    async createAttestation(demandeId: string, data: AttestationData) {
        // Générer l'attestation PDF
        const { numero, fichierPath, qrCodeData } = await this.generateAttestation(data);

        // Récupérer le directeur signataire (si configuré)
        const directeur = await prisma.user.findFirst({
            where: { role: 'DIRECTEUR', actif: true },
        });

        // Créer l'enregistrement
        const attestation = await prisma.attestation.create({
            data: {
                numero,
                demandeId,
                fichierPath,
                qrCodeData,
                statut: StatutAttestation.GENEREE,
                typeSignature: TypeSignature.ELECTRONIQUE,
                signataire: directeur ? { connect: { id: directeur.id } } : undefined,
            },
            include: {
                demande: true,
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
                signataire: {
                    select: {
                        id: true,
                        nom: true,
                        prenom: true,
                    },
                },
            },
        });
    }

    /**
     * Valide une attestation via son QR Code
     */
    async validateAttestation(numero: string, signature: string, timestamp: number) {
        // Vérifier que l'attestation existe
        const attestation = await this.getAttestationByNumero(numero);

        if (!attestation) {
            return {
                valid: false,
                reason: 'Attestation non trouvée',
            };
        }

        // Vérifier que l'attestation est signée
        if (attestation.statut !== StatutAttestation.SIGNEE) {
            return {
                valid: false,
                reason: 'Attestation non signée',
                attestation: {
                    numero: attestation.numero,
                    nom: attestation.demande.appele?.nom || '',
                    prenom: attestation.demande.appele?.prenom || '',
                    dateNaissance: attestation.demande.appele?.dateNaissance || new Date(),
                    diplome: attestation.demande.appele?.diplome || '',
                    promotion: attestation.demande.appele?.promotion || '',
                    dateGeneration: attestation.dateGeneration,
                    statut: attestation.statut,
                },
            };
        }

        // Vérifier la signature du QR Code
        const isValidSignature = qrcodeService.verifySignature(
            attestation.qrCodeData,
            signature,
            timestamp
        );

        if (!isValidSignature) {
            return {
                valid: false,
                reason: 'Signature QR Code invalide',
            };
        }

        return {
            valid: true,
            attestation: {
                numero: attestation.numero,
                nom: attestation.demande.appele?.nom || '',
                prenom: attestation.demande.appele?.prenom || '',
                dateNaissance: attestation.demande.appele?.dateNaissance || new Date(),
                diplome: attestation.demande.appele?.diplome || '',
                promotion: attestation.demande.appele?.promotion || '',
                dateGeneration: attestation.dateGeneration,
                statut: attestation.statut,
            },
        };
    }

    /**
     * Valide une attestation par son numéro uniquement (sans signature QR)
     */
    async validateAttestationByNumero(numero: string) {
        // Vérifier que l'attestation existe
        const attestation = await this.getAttestationByNumero(numero);

        if (!attestation) {
            return {
                valid: false,
                reason: 'Attestation non trouvée',
            };
        }

        // Vérifier que l'attestation est signée
        if (attestation.statut !== StatutAttestation.SIGNEE) {
            return {
                valid: false,
                reason: 'Attestation non signée ou invalidée',
                attestation: {
                    numero: attestation.numero,
                    nom: attestation.demande.appele?.nom || '',
                    prenom: attestation.demande.appele?.prenom || '',
                    dateNaissance: attestation.demande.appele?.dateNaissance || new Date(),
                    diplome: attestation.demande.appele?.diplome || '',
                    promotion: attestation.demande.appele?.promotion || '',
                    dateGeneration: attestation.dateGeneration,
                    statut: attestation.statut,
                },
            };
        }

        return {
            valid: true,
            attestation: {
                numero: attestation.numero,
                nom: attestation.demande.appele?.nom || '',
                prenom: attestation.demande.appele?.prenom || '',
                dateNaissance: attestation.demande.appele?.dateNaissance || new Date(),
                diplome: attestation.demande.appele?.diplome || '',
                promotion: attestation.demande.appele?.promotion || '',
                dateGeneration: attestation.dateGeneration,
                statut: attestation.statut,
            },
        };
    }
}

export const attestationService = new AttestationService();
