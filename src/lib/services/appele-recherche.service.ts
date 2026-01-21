import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';

// Type pour les résultats de recherche avec l'arrêté inclus
export type AppeleRechercheResult = Prisma.AppeleArreteGetPayload<{
    include: {
        arrete: {
            select: {
                id: true;
                numero: true;
                dateArrete: true;
                promotion: true;
                annee: true;
                lieuService: true;
            };
        };
    };
}>;

/**
 * Service de recherche des appelés dans les arrêtés
 * Recherche dans la table appeles_arretes (système Excel)
 */
export class AppeleRechercheService {
    /**
     * Recherche rapide par nom/prénoms
     * Recherche flexible: chaque terme peut être dans le nom OU les prénoms
     */
    async rechercheRapide(query: string, limit: number = 10): Promise<AppeleRechercheResult[]> {
        if (!query || query.trim().length < 2) {
            return [];
        }

        const terms = query.trim().toLowerCase().split(/\s+/);
        
        // Construire les conditions: chaque terme doit être trouvé dans nom OU prénoms
        const conditions = terms.map(term => ({
            OR: [
                {
                    nom: {
                        contains: term,
                        mode: 'insensitive' as const,
                    },
                },
                {
                    prenoms: {
                        contains: term,
                        mode: 'insensitive' as const,
                    },
                },
            ],
        }));

        return await prisma.appeleArrete.findMany({
            where: {
                AND: conditions,
            },
            include: {
                arrete: {
                    select: {
                        id: true,
                        numero: true,
                        dateArrete: true,
                        promotion: true,
                        annee: true,
                        lieuService: true,
                    },
                },
            },
            take: limit,
            orderBy: [
                { nom: 'asc' },
                { prenoms: 'asc' },
            ],
        });
    }

    /**
     * Recherche par numéro d'appelé dans un arrêté
     */
    async rechercheParNumero(arreteId: string, numero: number): Promise<AppeleRechercheResult | null> {
        return await prisma.appeleArrete.findFirst({
            where: {
                arreteId,
                numero,
            },
            include: {
                arrete: {
                    select: {
                        id: true,
                        numero: true,
                        dateArrete: true,
                        promotion: true,
                        annee: true,
                        lieuService: true,
                    },
                },
            },
        });
    }

    /**
     * Recherche avancée avec filtres
     */
    async rechercheAvancee(params: {
        nom?: string;
        prenoms?: string;
        promotion?: string;
        annee?: string;
        numeroArrete?: string;
        dateNaissanceMin?: Date;
        dateNaissanceMax?: Date;
        lieuNaissance?: string;
        lieuService?: string;
        diplome?: string;
        limit?: number;
    }): Promise<AppeleRechercheResult[]> {
        const {
            nom,
            prenoms,
            promotion,
            annee,
            numeroArrete,
            dateNaissanceMin,
            dateNaissanceMax,
            lieuNaissance,
            lieuService,
            diplome,
            limit = 50,
        } = params;

        const where: Prisma.AppeleArreteWhereInput = {};

        // Filtres sur l'appelé
        if (nom) {
            where.nom = { contains: nom, mode: 'insensitive' };
        }
        if (prenoms) {
            where.prenoms = { contains: prenoms, mode: 'insensitive' };
        }
        if (lieuNaissance) {
            where.lieuNaissance = { contains: lieuNaissance, mode: 'insensitive' };
        }
        if (lieuService) {
            where.lieuService = { contains: lieuService, mode: 'insensitive' };
        }
        if (diplome) {
            where.diplome = { contains: diplome, mode: 'insensitive' };
        }
        if (dateNaissanceMin || dateNaissanceMax) {
            where.dateNaissance = {};
            if (dateNaissanceMin) where.dateNaissance.gte = dateNaissanceMin;
            if (dateNaissanceMax) where.dateNaissance.lte = dateNaissanceMax;
        }

        // Filtres sur l'arrêté
        if (promotion || annee || numeroArrete) {
            where.arrete = {};
            if (promotion) where.arrete.promotion = { contains: promotion, mode: 'insensitive' };
            if (annee) where.arrete.annee = annee;
            if (numeroArrete) where.arrete.numero = { contains: numeroArrete, mode: 'insensitive' };
        }

        return await prisma.appeleArrete.findMany({
            where,
            include: {
                arrete: {
                    select: {
                        id: true,
                        numero: true,
                        dateArrete: true,
                        promotion: true,
                        annee: true,
                        lieuService: true,
                    },
                },
            },
            take: limit,
            orderBy: [
                { arrete: { dateArrete: 'desc' } },
                { numero: 'asc' },
            ],
        });
    }

    /**
     * Liste tous les appelés d'un arrêté
     */
    async listeParArrete(arreteId: string): Promise<AppeleRechercheResult[]> {
        return await prisma.appeleArrete.findMany({
            where: { arreteId },
            include: {
                arrete: {
                    select: {
                        id: true,
                        numero: true,
                        dateArrete: true,
                        promotion: true,
                        annee: true,
                        lieuService: true,
                    },
                },
            },
            orderBy: { numero: 'asc' },
        });
    }

    /**
     * Statistiques des appelés
     */
    async getStatistiques() {
        const total = await prisma.appeleArrete.count();
        
        const parArrete = await prisma.appeleArrete.groupBy({
            by: ['arreteId'],
            _count: true,
        });

        const parPromotion = await prisma.arrete.findMany({
            select: {
                promotion: true,
                _count: {
                    select: {
                        appeles: true,
                    },
                },
            },
            orderBy: {
                promotion: 'desc',
            },
        });

        return {
            totalAppeles: total,
            nombreArretes: parArrete.length,
            moyenneParArrete: parArrete.length > 0 ? Math.round(total / parArrete.length) : 0,
            parPromotion: parPromotion.map(p => ({
                promotion: p.promotion,
                count: p._count.appeles,
            })),
        };
    }
}

export const appeleRechercheService = new AppeleRechercheService();
