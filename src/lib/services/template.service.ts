/**
 * Service de gestion des templates d'attestation
 * Permet de créer, modifier et utiliser des templates configurables
 */

import { prisma } from '../prisma';
import path from 'path';
import { mkdir, writeFile, unlink } from 'fs/promises';

// Types pour la configuration du template
export interface TemplateField {
    id: string;
    label: string;
    type: 'text' | 'date' | 'qrcode' | 'signature';
    x: number;
    y: number;
    width?: number;
    height?: number;
    fontSize: number;
    fontFamily: 'Helvetica' | 'Times' | 'Courier';
    fontWeight: 'normal' | 'bold';
    color: string;
    textAlign: 'left' | 'center' | 'right';
    format?: string;
    prefix?: string;
    suffix?: string;
}

export interface TemplateConfig {
    version: number;
    backgroundImage: string;
    pageWidth: number;
    pageHeight: number;
    pageOrientation: 'portrait' | 'landscape';
    fields: TemplateField[];
}

// Champs disponibles par défaut
export const AVAILABLE_FIELDS: Omit<TemplateField, 'x' | 'y'>[] = [
    {
        id: 'numero',
        label: 'N° Attestation',
        type: 'text',
        fontSize: 10,
        fontFamily: 'Helvetica',
        fontWeight: 'normal',
        color: '#000000',
        textAlign: 'left',
        prefix: 'N° ',
    },
    {
        id: 'civilite',
        label: 'Civilité (M./Mme/Mlle)',
        type: 'text',
        fontSize: 12,
        fontFamily: 'Helvetica',
        fontWeight: 'normal',
        color: '#000000',
        textAlign: 'left',
    },
    {
        id: 'prenomNom',
        label: 'Prénom et Nom',
        type: 'text',
        fontSize: 12,
        fontFamily: 'Helvetica',
        fontWeight: 'bold',
        color: '#000000',
        textAlign: 'left',
    },
    {
        id: 'dateNaissance',
        label: 'Date de naissance',
        type: 'date',
        fontSize: 12,
        fontFamily: 'Helvetica',
        fontWeight: 'normal',
        color: '#000000',
        textAlign: 'left',
        format: 'dd MMMM yyyy',
        prefix: 'Né(e) le ',
    },
    {
        id: 'lieuNaissance',
        label: 'Lieu de naissance',
        type: 'text',
        fontSize: 12,
        fontFamily: 'Helvetica',
        fontWeight: 'normal',
        color: '#000000',
        textAlign: 'left',
        prefix: 'à ',
    },
    {
        id: 'diplome',
        label: 'Diplôme',
        type: 'text',
        fontSize: 12,
        fontFamily: 'Helvetica',
        fontWeight: 'normal',
        color: '#000000',
        textAlign: 'left',
        prefix: 'Titulaire d\'',
    },
    {
        id: 'lieuService',
        label: 'Lieu de service',
        type: 'text',
        fontSize: 12,
        fontFamily: 'Helvetica',
        fontWeight: 'normal',
        color: '#000000',
        textAlign: 'left',
        prefix: 'A accompli avec assiduité le Service Civique National à/au ',
    },
    {
        id: 'dateDebutService',
        label: 'Date début service',
        type: 'date',
        fontSize: 12,
        fontFamily: 'Helvetica',
        fontWeight: 'normal',
        color: '#000000',
        textAlign: 'left',
        format: 'dd/MM/yyyy',
        prefix: 'Durant la période du ',
    },
    {
        id: 'dateFinService',
        label: 'Date fin service',
        type: 'date',
        fontSize: 12,
        fontFamily: 'Helvetica',
        fontWeight: 'normal',
        color: '#000000',
        textAlign: 'left',
        format: 'dd/MM/yyyy',
        prefix: 'au ',
    },
    {
        id: 'dateSignature',
        label: 'Date de signature',
        type: 'date',
        fontSize: 12,
        fontFamily: 'Helvetica',
        fontWeight: 'normal',
        color: '#000000',
        textAlign: 'left',
        format: 'dd MMMM yyyy',
        prefix: 'Niamey, le ',
    },
    {
        id: 'nomDirecteur',
        label: 'Nom du Directeur',
        type: 'text',
        fontSize: 12,
        fontFamily: 'Helvetica',
        fontWeight: 'bold',
        color: '#000000',
        textAlign: 'center',
    },
    {
        id: 'qrcode',
        label: 'QR Code',
        type: 'qrcode',
        fontSize: 12,
        fontFamily: 'Helvetica',
        fontWeight: 'normal',
        color: '#000000',
        textAlign: 'left',
        width: 80,
        height: 80,
    },
    {
        id: 'signature',
        label: 'Signature',
        type: 'signature',
        fontSize: 12,
        fontFamily: 'Helvetica',
        fontWeight: 'normal',
        color: '#000000',
        textAlign: 'center',
        width: 150,
        height: 60,
    },
];

class TemplateService {
    private readonly uploadDir = path.join(process.cwd(), 'public', 'uploads', 'templates');

    /**
     * Liste tous les templates
     */
    async getAll() {
        return prisma.templateAttestation.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Récupère un template par son ID
     */
    async getById(id: string) {
        return prisma.templateAttestation.findUnique({
            where: { id },
        });
    }

    /**
     * Récupère le template actif
     */
    async getActive() {
        return prisma.templateAttestation.findFirst({
            where: { actif: true },
        });
    }

    /**
     * Crée un nouveau template
     */
    async create(data: {
        nom: string;
        description?: string;
        backgroundImage: Buffer;
        backgroundFilename: string;
    }) {
        // Créer le dossier d'upload si nécessaire
        await mkdir(this.uploadDir, { recursive: true });

        // Générer un nom de fichier unique
        const timestamp = Date.now();
        const ext = path.extname(data.backgroundFilename);
        const filename = `background_${timestamp}${ext}`;
        const filepath = path.join(this.uploadDir, filename);

        // Sauvegarder l'image
        await writeFile(filepath, data.backgroundImage);

        // Configuration par défaut
        const defaultConfig: TemplateConfig = {
            version: 1,
            backgroundImage: `/uploads/templates/${filename}`,
            pageWidth: 842, // A4 paysage
            pageHeight: 595,
            pageOrientation: 'landscape',
            fields: [],
        };

        // Créer le template en base
        return prisma.templateAttestation.create({
            data: {
                nom: data.nom,
                fichierPath: `/uploads/templates/${filename}`,
                mappingChamps: JSON.stringify(defaultConfig),
                actif: false,
            },
        });
    }

    /**
     * Met à jour la configuration des champs d'un template
     */
    async updateConfig(id: string, config: TemplateConfig) {
        return prisma.templateAttestation.update({
            where: { id },
            data: {
                mappingChamps: JSON.stringify(config),
            },
        });
    }

    /**
     * Met à jour les informations d'un template
     */
    async update(id: string, data: { nom?: string }) {
        return prisma.templateAttestation.update({
            where: { id },
            data,
        });
    }

    /**
     * Active un template (et désactive les autres)
     */
    async activate(id: string) {
        // Désactiver tous les templates
        await prisma.templateAttestation.updateMany({
            data: { actif: false },
        });

        // Activer le template sélectionné
        return prisma.templateAttestation.update({
            where: { id },
            data: { actif: true },
        });
    }

    /**
     * Supprime un template
     */
    async delete(id: string) {
        const template = await this.getById(id);
        if (!template) {
            throw new Error('Template non trouvé');
        }

        // Supprimer le fichier image
        if (template.fichierPath) {
            const filepath = path.join(process.cwd(), 'public', template.fichierPath);
            try {
                await unlink(filepath);
            } catch (err) {
                console.warn('Impossible de supprimer le fichier:', err);
            }
        }

        // Supprimer le template en base
        return prisma.templateAttestation.delete({
            where: { id },
        });
    }

    /**
     * Parse la configuration d'un template
     */
    parseConfig(template: { mappingChamps: string }): TemplateConfig | null {
        try {
            return JSON.parse(template.mappingChamps) as TemplateConfig;
        } catch {
            return null;
        }
    }

    /**
     * Retourne les champs disponibles
     */
    getAvailableFields() {
        return AVAILABLE_FIELDS;
    }
}

export const templateService = new TemplateService();
