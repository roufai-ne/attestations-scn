/**
 * API Route - Rapport des attestations
 * Génère un export Excel des attestations avec filtres
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ExcelService } from '@/lib/reports/excel.service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Récupérer les paramètres de filtrage
    const { searchParams } = new URL(request.url);
    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');
    const typeSignature = searchParams.get('typeSignature');

    // Construire les filtres Prisma
    const where: any = {};

    if (dateDebut) {
      where.dateGeneration = {
        ...where.dateGeneration,
        gte: new Date(dateDebut),
      };
    }

    if (dateFin) {
      where.dateGeneration = {
        ...where.dateGeneration,
        lte: new Date(dateFin),
      };
    }

    if (typeSignature && typeSignature !== 'TOUS') {
      where.typeSignature = typeSignature;
    }

    // Récupérer les attestations
    const attestations = await prisma.attestation.findMany({
      where,
      include: {
        demande: {
          include: {
            appele: true,
          },
        },
        signataire: true,
      },
      orderBy: {
        dateGeneration: 'desc',
      },
    });

    // Générer le fichier Excel
    const buffer = ExcelService.exportAttestationsReport(attestations);

    // Retourner le fichier
    const fileName = ExcelService.generateFileName('rapport_attestations');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Erreur génération rapport attestations:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du rapport' },
      { status: 500 }
    );
  }
}
