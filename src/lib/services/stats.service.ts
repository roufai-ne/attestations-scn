import { prisma } from '../prisma';
import { StatutAttestation, StatutDemande } from '@prisma/client';

export interface DirecteurStats {
    attestations: {
        total: number;
        enAttente: number;
        signees: number;
        signeesAujourdHui: number;
        signeesCeMois: number;
    };
    demandes: {
        total: number;
        enCours: number;
        validees: number;
        rejetees: number;
    };
    evolutionMensuelle: {
        mois: string;
        count: number;
    }[];
    parPromotion: {
        promotion: string;
        count: number;
    }[];
    alertes: {
        dossiersAnciens: number; // > 7 jours en attente
    };
}

/**
 * Service de statistiques pour le directeur
 */
export class StatsService {
    /**
     * Récupère les statistiques globales pour le directeur
     */
    async getDirecteurStats(): Promise<DirecteurStats> {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // Statistiques des attestations
        const [
            totalAttestations,
            attestationsEnAttente,
            attestationsSignees,
            attestationsSigneesAujourdHui,
            attestationsSigneesCeMois,
        ] = await Promise.all([
            prisma.attestation.count(),
            prisma.attestation.count({
                where: { statut: 'GENEREE' },
            }),
            prisma.attestation.count({
                where: { statut: 'SIGNEE' },
            }),
            prisma.attestation.count({
                where: {
                    statut: 'SIGNEE',
                    dateSignature: { gte: startOfToday },
                },
            }),
            prisma.attestation.count({
                where: {
                    statut: 'SIGNEE',
                    dateSignature: { gte: startOfMonth },
                },
            }),
        ]);

        // Statistiques des demandes
        const [totalDemandes, demandesEnCours, demandesValidees, demandesRejetees] =
            await Promise.all([
                prisma.demande.count(),
                prisma.demande.count({
                    where: { statut: 'EN_COURS' },
                }),
                prisma.demande.count({
                    where: { statut: 'VALIDEE' },
                }),
                prisma.demande.count({
                    where: { statut: 'REJETEE' },
                }),
            ]);

        // Évolution mensuelle (6 derniers mois)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const evolutionData = await prisma.attestation.groupBy({
            by: ['dateGeneration'],
            where: {
                dateGeneration: { gte: sixMonthsAgo },
            },
            _count: true,
        });

        // Grouper par mois
        const evolutionMensuelle = this.groupByMonth(evolutionData);

        // Statistiques par promotion
        const parPromotionData = await prisma.demande.groupBy({
            by: ['appele'],
            _count: true,
            where: {
                attestation: { isNot: null },
            },
        });

        // Extraire les promotions (nécessite une jointure)
        const parPromotion = await this.getStatsByPromotion();

        // Alertes
        const dossiersAnciens = await prisma.attestation.count({
            where: {
                statut: 'GENEREE',
                dateGeneration: { lt: sevenDaysAgo },
            },
        });

        return {
            attestations: {
                total: totalAttestations,
                enAttente: attestationsEnAttente,
                signees: attestationsSignees,
                signeesAujourdHui: attestationsSigneesAujourdHui,
                signeesCeMois: attestationsSigneesCeMois,
            },
            demandes: {
                total: totalDemandes,
                enCours: demandesEnCours,
                validees: demandesValidees,
                rejetees: demandesRejetees,
            },
            evolutionMensuelle,
            parPromotion,
            alertes: {
                dossiersAnciens,
            },
        };
    }

    /**
     * Groupe les données par mois
     */
    private groupByMonth(
        data: { dateGeneration: Date; _count: number }[]
    ): { mois: string; count: number }[] {
        const monthMap = new Map<string, number>();

        data.forEach((item) => {
            const date = new Date(item.dateGeneration);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            monthMap.set(key, (monthMap.get(key) || 0) + item._count);
        });

        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

        return Array.from(monthMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([key, count]) => {
                const [year, month] = key.split('-');
                return {
                    mois: `${months[parseInt(month) - 1]} ${year}`,
                    count,
                };
            });
    }

    /**
     * Récupère les statistiques par promotion
     */
    private async getStatsByPromotion(): Promise<{ promotion: string; count: number }[]> {
        const result = await prisma.$queryRaw<{ promotion: string; count: bigint }[]>`
      SELECT a.promotion, COUNT(*)::int as count
      FROM demandes d
      INNER JOIN appeles a ON d."appeleId" = a.id
      WHERE d."attestationId" IS NOT NULL
      GROUP BY a.promotion
      ORDER BY count DESC
      LIMIT 10
    `;

        return result.map((r) => ({
            promotion: r.promotion,
            count: Number(r.count),
        }));
    }

    /**
     * Récupère les attestations en attente de signature
     */
    async getAttestationsEnAttente(limit: number = 10) {
        return prisma.attestation.findMany({
            where: {
                statut: 'GENEREE',
            },
            include: {
                demande: {
                    include: {
                        appele: true,
                    },
                },
            },
            orderBy: {
                dateGeneration: 'asc', // Les plus anciennes en premier
            },
            take: limit,
        });
    }

    /**
     * Récupère toutes les attestations avec filtres
     */
    async getAllAttestations(filters?: {
        statut?: StatutAttestation;
        dateDebut?: Date;
        dateFin?: Date;
        promotion?: string;
    }) {
        const where: any = {};

        if (filters?.statut) {
            where.statut = filters.statut;
        }

        if (filters?.dateDebut || filters?.dateFin) {
            where.dateGeneration = {};
            if (filters.dateDebut) {
                where.dateGeneration.gte = filters.dateDebut;
            }
            if (filters.dateFin) {
                where.dateGeneration.lte = filters.dateFin;
            }
        }

        return prisma.attestation.findMany({
            where,
            include: {
                demande: {
                    include: {
                        appele: true,
                    },
                },
            },
            orderBy: {
                dateGeneration: 'desc',
            },
        });
    }
}

export const statsService = new StatsService();
