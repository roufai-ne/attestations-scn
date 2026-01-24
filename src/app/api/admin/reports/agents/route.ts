/**
 * API Route - Rapport d'activité des agents
 * Génère un export Excel des statistiques d'activité des agents
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ExcelService } from '@/lib/reports/excel.service';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Récupérer les paramètres de filtrage
    const { searchParams } = new URL(request.url);
    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');

    // Récupérer tous les agents
    const agents = await prisma.user.findMany({
      where: {
        role: 'AGENT',
        actif: true,
      },
      include: {
        demandesTraitees: {
          where: {
            ...(dateDebut && dateFin
              ? {
                  dateEnregistrement: {
                    gte: new Date(dateDebut),
                    lte: new Date(dateFin),
                  },
                }
              : {}),
          },
        },
      },
    });

    // Calculer les statistiques pour chaque agent
    const agentsWithStats = agents.map((agent) => {
      const demandes = agent.demandesTraitees;
      const total = demandes.length;
      const validees = demandes.filter((d) => d.statut === 'VALIDEE').length;
      const rejetees = demandes.filter((d) => d.statut === 'REJETEE').length;
      const tauxValidation = total > 0 ? Math.round((validees / total) * 100) : 0;

      // Calculer le temps moyen de traitement
      const demandesTerminees = demandes.filter(
        (d) => d.statut === 'VALIDEE' || d.statut === 'REJETEE'
      );

      let tempsMoyen = 0;
      if (demandesTerminees.length > 0) {
        const totalJours = demandesTerminees.reduce((acc, d) => {
          const dateDebut = new Date(d.dateEnregistrement);
          const dateFin = d.dateValidation ? new Date(d.dateValidation) : new Date();
          const diffMs = dateFin.getTime() - dateDebut.getTime();
          const diffJours = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          return acc + diffJours;
        }, 0);
        tempsMoyen = Math.round(totalJours / demandesTerminees.length);
      }

      return {
        id: agent.id,
        nom: agent.nom,
        prenom: agent.prenom,
        email: agent.email,
        createdAt: agent.createdAt,
        stats: {
          total,
          validees,
          rejetees,
          tauxValidation,
          tempsMoyen,
        },
      };
    });

    // Générer le fichier Excel
    const buffer = await ExcelService.exportAgentsReport(agentsWithStats);

    // Retourner le fichier
    const fileName = ExcelService.generateFileName('rapport_agents');

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Erreur génération rapport agents:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du rapport' },
      { status: 500 }
    );
  }
}
