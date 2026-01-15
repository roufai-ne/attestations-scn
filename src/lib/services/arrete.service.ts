import { prisma } from '../prisma';
import { Arrete, StatutIndexation } from '@prisma/client';
import { addOCRJob } from './queue.service';
import { unlink } from 'fs/promises';
import path from 'path';

export interface CreateArreteInput {
    numero: string;
    dateArrete: Date;
    promotion: string;
    annee: string;
    fichierPath: string;
}

export interface SearchArreteResult {
    id: string;
    numero: string;
    promotion: string;
    annee: string;
    excerpt: string;
    rank: number;
}

/**
 * Service de gestion des arrêtés de service civique
 */
export class ArreteService {
    /**
     * Crée un nouvel arrêté et lance l'indexation OCR
     */
    async createArrete(data: CreateArreteInput): Promise<Arrete> {
        // Créer l'arrêté dans la base de données
        const arrete = await prisma.arrete.create({
            data: {
                numero: data.numero,
                dateArrete: data.dateArrete,
                promotion: data.promotion,
                annee: data.annee,
                fichierPath: data.fichierPath,
                statutIndexation: StatutIndexation.EN_ATTENTE,
            },
        });

        // Ajouter à la queue pour traitement OCR
        await addOCRJob(arrete.id, data.fichierPath);

        console.log(`📄 Arrêté créé: ${arrete.numero} (ID: ${arrete.id})`);

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
     * Supprime un arrêté et son fichier
     */
    async deleteArrete(id: string): Promise<void> {
        const arrete = await this.getArreteById(id);

        if (!arrete) {
            throw new Error('Arrêté introuvable');
        }

        // Supprimer le fichier PDF
        try {
            await unlink(arrete.fichierPath);
            console.log(`🗑️ Fichier supprimé: ${arrete.fichierPath}`);
        } catch (error) {
            console.warn(`⚠️ Impossible de supprimer le fichier: ${arrete.fichierPath}`, error);
        }

        // Supprimer de la base de données
        await prisma.arrete.delete({
            where: { id },
        });

        console.log(`🗑️ Arrêté supprimé: ${arrete.numero}`);
    }

    /**
     * Relance l'indexation OCR d'un arrêté
     */
    async reindexArrete(id: string): Promise<void> {
        const arrete = await this.getArreteById(id);

        if (!arrete) {
            throw new Error('Arrêté introuvable');
        }

        // Réinitialiser le statut
        await prisma.arrete.update({
            where: { id },
            data: {
                statutIndexation: StatutIndexation.EN_ATTENTE,
                contenuOCR: null,
                messageErreur: null,
                dateIndexation: null,
            },
        });

        // Relancer le job OCR
        await addOCRJob(arrete.id, arrete.fichierPath);

        console.log(`🔄 Réindexation lancée pour l'arrêté: ${arrete.numero}`);
    }

    /**
     * Recherche dans le contenu OCR des arrêtés
     * Utilise PostgreSQL full-text search
     */
    async searchInArretes(query: string, limit: number = 10): Promise<SearchArreteResult[]> {
        if (!query || query.trim().length < 2) {
            return [];
        }

        // Nettoyer et préparer la requête
        const searchQuery = query.trim().replace(/\s+/g, ' & ');

        // Recherche full-text avec PostgreSQL
        const results = await prisma.$queryRaw<SearchArreteResult[]>`
      SELECT 
        id,
        numero,
        "dateArrete",
        promotion,
        annee,
        ts_headline('french', "contenuOCR", to_tsquery('french', ${searchQuery}), 
          'MaxWords=50, MinWords=25, ShortWord=3, HighlightAll=false, MaxFragments=1'
        ) as excerpt,
        ts_rank(to_tsvector('french', "contenuOCR"), to_tsquery('french', ${searchQuery})) as rank
      FROM arretes
      WHERE 
        "statutIndexation" = 'INDEXE'
        AND to_tsvector('french', "contenuOCR") @@ to_tsquery('french', ${searchQuery})
      ORDER BY rank DESC
      LIMIT ${limit}
    `;

        return results;
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
