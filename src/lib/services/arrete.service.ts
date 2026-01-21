import { prisma } from '../prisma';
import { Arrete, StatutIndexation } from '@prisma/client';
import { logger } from '@/lib/logger';

export interface CreateArreteInput {
    numero: string;
    dateArrete: Date;
    promotion: string;
    annee: string;
    fichierPath?: string | null;
    lieuService?: string;
    statutIndexation?: StatutIndexation;
}

export interface SearchArreteResult {
    id: string;
    numero: string;
    dateArrete: Date | string;
    promotion: string;
    annee: string;
    fichierPath: string;
    excerpt: string;
    rank: number;
}

/**
 * Service de gestion des arrêtés de service civique
 */
export class ArreteService {
    /**
     * Crée un nouvel arrêté (système Excel - sans OCR)
     */
    async createArrete(data: CreateArreteInput): Promise<Arrete> {
        // Créer l'arrêté dans la base de données
        const arrete = await prisma.arrete.create({
            data: {
                numero: data.numero,
                dateArrete: data.dateArrete,
                promotion: data.promotion,
                annee: data.annee,
                fichierPath: data.fichierPath || null,
                lieuService: data.lieuService || null,
                statutIndexation: data.statutIndexation || StatutIndexation.INDEXED,
            },
        });

        logger.info(`Arrêté créé: ${arrete.numero} (ID: ${arrete.id})`);

        return arrete;
    }

    /**
     * Récupère un arrêté par son ID
     */
    async getArreteById(id: string): Promise<Arrete | null> {
        return prisma.arrete.findUnique({
            where: { id },
        });
    }

    /**
     * Liste les arrêtés avec pagination et filtres
     */
    async listArretes(params: {
        page?: number;
        limit?: number;
        statut?: StatutIndexation;
        promotion?: string;
        annee?: string;
        search?: string;
    }) {
        const page = params.page || 1;
        const limit = params.limit || 20;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (params.statut) {
            where.statutIndexation = params.statut;
        }

        if (params.promotion) {
            where.promotion = params.promotion;
        }

        if (params.annee) {
            where.annee = params.annee;
        }

        // Recherche fulltext sur numero et contenuOCR
        if (params.search) {
            where.OR = [
                { numero: { contains: params.search, mode: 'insensitive' } },
                { contenuOCR: { contains: params.search, mode: 'insensitive' } },
            ];
        }

        const [arretes, total] = await Promise.all([
            prisma.arrete.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.arrete.count({ where }),
        ]);

        return {
            data: arretes,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Met à jour les métadonnées d'un arrêté
     */
    async updateArrete(
        id: string,
        data: Partial<Pick<Arrete, 'numero' | 'dateArrete' | 'promotion' | 'annee'>>
    ): Promise<Arrete> {
        return prisma.arrete.update({
            where: { id },
            data,
        });
    }

    /**
     * Supprime un arrêté
     */
    async deleteArrete(id: string): Promise<void> {
        const arrete = await this.getArreteById(id);

        if (!arrete) {
            throw new Error('Arrêté introuvable');
        }

        // Supprimer de la base de données (les appelés seront supprimés en cascade)
        await prisma.arrete.delete({
            where: { id },
        });

        logger.info(`Arrêté supprimé: ${arrete.numero}`);
    }



    /**
     * Obtient les statistiques d'indexation
     */
    async getIndexationStats() {
        const stats = await prisma.arrete.groupBy({
            by: ['statutIndexation'],
            _count: true,
        });

        const total = await prisma.arrete.count();

        return {
            total,
            byStatus: stats.reduce((acc, stat) => {
                acc[stat.statutIndexation] = stat._count;
                return acc;
            }, {} as Record<StatutIndexation, number>),
        };
    }
}

export const arreteService = new ArreteService();
