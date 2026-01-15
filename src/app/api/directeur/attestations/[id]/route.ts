/**
 * API Route - Détail d'une attestation pour le directeur
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || (session.user.role !== 'DIRECTEUR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { id } = await params;

    const attestation = await prisma.attestation.findUnique({
      where: { id },
      include: {
        demande: {
          include: {
            appele: true,
            agent: {
              select: {
                nom: true,
                prenom: true,
                email: true,
              },
            },
          },
        },
        signataire: {
          select: {
            nom: true,
            prenom: true,
            email: true,
          },
        },
      },
    });

    if (!attestation) {
      return NextResponse.json({ error: 'Attestation non trouvée' }, { status: 404 });
    }

    return NextResponse.json(attestation);
  } catch (error) {
    console.error('Erreur récupération attestation:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'attestation' },
      { status: 500 }
    );
  }
}
