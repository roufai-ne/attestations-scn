/**
 * API Route - Statistiques globales pour le dashboard admin
 * GET /api/admin/stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Statistiques globales des demandes
    const [
      totalDemandes,
      demandesParStatut,
      demandesParMois,
      agentsStats,
      promotionsStats,
    ] = await Promise.all([
      // Total des demandes
      prisma.demande.count(),

      // Demandes par statut
      prisma.demande.groupBy({
        by: ['statut'],
        _count: true,
      }),

      // Demandes des 12 derniers mois
      prisma.demande.groupBy({
        by: ['dateEnregistrement'],
        _count: true,
        where: {
          dateEnregistrement: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 12)),
          },
        },
      }),

      // Statistiques par agent
      prisma.user.findMany({
        where: {
          role: 'AGENT',
          actif: true,
        },
        select: {
          id: true,
          nom: true,
          prenom: true,
          _count: {
            select: {
              demandesTraitees: true,
            },
          },
        },
        orderBy: {
          demandesTraitees: {
            _count: 'desc',
          },
        },
        take: 5,
      }),

      // Top 5 promotions
      prisma.appele.groupBy({
        by: ['promotion'],
        _count: true,
        orderBy: {
          _count: {
            promotion: 'desc',
          },
        },
        take: 5,
      }),
    ]);

    // Traiter les statistiques par statut
    const statutCounts = demandesParStatut.reduce((acc: any, item) => {
      acc[item.statut] = item._count;
      return acc;
    }, {});

    // Traiter les données mensuelles
    const monthlyData = processMonthlyData(demandesParMois);

    // Calculer les taux
    const totalValidees = statutCounts.VALIDEE || 0;
    const totalRejetees = statutCounts.REJETEE || 0;
    const totalTraitees = totalValidees + totalRejetees;
    const tauxValidation = totalTraitees > 0 ? (totalValidees / totalTraitees) * 100 : 0;

    return NextResponse.json({
      overview: {
        totalDemandes,
        enCours: statutCounts.EN_TRAITEMENT || 0,
        validees: totalValidees,
        rejetees: totalRejetees,
        signees: statutCounts.SIGNEE || 0,
        delivrees: statutCounts.DELIVREE || 0,
        tauxValidation: Math.round(tauxValidation),
      },
      statutCounts,
      monthlyData,
      topAgents: agentsStats.map((agent) => ({
        nom: `${agent.prenom} ${agent.nom}`,
        count: agent._count.demandesTraitees,
      })),
      topPromotions: promotionsStats.map((p) => ({
        promotion: p.promotion,
        count: p._count,
      })),
      tempsTraitement: {
        moyenJours: calculateAverageProcessingDays(),
      },
    });
  } catch (error) {
    console.error('Erreur GET stats:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Traiter les données mensuelles
function processMonthlyData(data: any[]): any[] {
  const months: any = {};
  const now = new Date();

  // Initialiser les 12 derniers mois
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    months[key] = { month: key, count: 0 };
  }

  // Remplir avec les données
  data.forEach((item) => {
    const date = new Date(item.dateEnregistrement);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (months[key]) {
      months[key].count += item._count;
    }
  });

  return Object.values(months);
}

// Calculer le temps moyen de traitement (simulation pour l'instant)
function calculateAverageProcessingDays(): number {
  // Cette fonction devrait calculer la différence moyenne entre dateEnregistrement et dateValidation
  // Pour l'instant, on retourne une valeur par défaut
  return 3; // 3 jours en moyenne
}
