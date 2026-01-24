/**
 * API Route - Rapport des demandes
 * Génère un export Excel ou PDF des demandes avec filtres
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ExcelService } from '@/lib/reports/excel.service';
import { rapportPDFService } from '@/lib/services/rapport-pdf.service';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
    const statut = searchParams.get('statut');
    const promotion = searchParams.get('promotion');
    const agentId = searchParams.get('agentId');
    const formatExport = searchParams.get('format') || 'excel'; // 'excel' ou 'pdf'

    // Construire les filtres Prisma
    const where: any = {};

    if (dateDebut) {
      where.dateEnregistrement = {
        ...where.dateEnregistrement,
        gte: new Date(dateDebut),
      };
    }

    if (dateFin) {
      where.dateEnregistrement = {
        ...where.dateEnregistrement,
        lte: new Date(dateFin),
      };
    }

    if (statut && statut !== 'TOUS') {
      where.statut = statut;
    }

    if (promotion) {
      where.appele = {
        is: {
          promotion: promotion,
        },
      };
    }

    if (agentId) {
      where.agentId = agentId;
    }

    // Récupérer les demandes
    const demandes = await prisma.demande.findMany({
      where,
      include: {
        appele: true,
        agent: true,
      },
      orderBy: {
        dateEnregistrement: 'desc',
      },
    });

    // Calculer les statistiques
    const stats = {
      total: demandes.length,
      enregistrees: demandes.filter(d => d.statut === 'ENREGISTREE').length,
      validees: demandes.filter(d => d.statut === 'VALIDEE').length,
      signees: demandes.filter(d => d.statut === 'SIGNEE').length,
      rejetees: demandes.filter(d => d.statut === 'REJETEE').length,
    };

    // Export selon le format demandé
    if (formatExport === 'pdf') {
      const pdfBuffer = await rapportPDFService.generateRapport({
        titre: 'Rapport des Demandes',
        sousTitre: 'Service Civique National du Niger',
        dateDebut: dateDebut ? new Date(dateDebut) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        dateFin: dateFin ? new Date(dateFin) : new Date(),
        generePar: `${session.user.prenom} ${session.user.nom}`,
        sections: [
          {
            titre: 'Statistiques Globales',
            type: 'statistiques',
            contenu: [
              { label: 'Total demandes', valeur: stats.total },
              { label: 'Enregistrées', valeur: stats.enregistrees },
              { label: 'Validées', valeur: stats.validees },
              { label: 'Signées', valeur: stats.signees },
              { label: 'Rejetées', valeur: stats.rejetees },
            ],
          },
          {
            titre: 'Liste des Demandes',
            type: 'table',
            contenu: {
              colonnes: ['N° Enregistrement', 'Nom', 'Prénom', 'Date', 'Statut'],
              lignes: demandes.map(d => [
                d.numeroEnregistrement,
                d.appele?.nom || '',
                d.appele?.prenom || '',
                format(d.dateEnregistrement, 'dd/MM/yyyy'),
                d.statut,
              ]),
            },
          },
        ],
      });

      const fileName = `rapport_demandes_${format(new Date(), 'yyyy-MM-dd')}.pdf`;

      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

    // Export Excel (par défaut)
    const buffer = await ExcelService.exportDemandesReport(demandes);
    const fileName = ExcelService.generateFileName('rapport_demandes');

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Erreur génération rapport demandes:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du rapport' },
      { status: 500 }
    );
  }
}

