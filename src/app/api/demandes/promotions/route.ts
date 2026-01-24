/**
 * API Route - Liste des promotions
 * GET /api/demandes/promotions - Récupère la liste des promotions distinctes
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer les promotions distinctes depuis la table Appele
    const appeles = await prisma.appele.findMany({
      select: {
        promotion: true,
      },
      distinct: ['promotion'],
      orderBy: {
        promotion: 'desc',
      },
    });

    const promotions = appeles.map((a) => a.promotion);

    return NextResponse.json({
      promotions,
    });
  } catch (error) {
    console.error('Erreur récupération promotions:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des promotions' },
      { status: 500 }
    );
  }
}
