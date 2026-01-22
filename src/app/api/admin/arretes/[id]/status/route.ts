import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/arretes/[id]/status
 * Récupère le statut d'indexation d'un arrêté
 * Note: La logique OCR a été remplacée par l'import Excel
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    const { id: arreteId } = await params;

    // Récupérer l'arrêté depuis la BDD
    const arrete = await prisma.arrete.findUnique({
      where: { id: arreteId },
      select: {
        id: true,
        numero: true,
        statutIndexation: true,
        messageErreur: true,
        dateIndexation: true,
        _count: {
          select: { appeles: true }
        }
      },
    });

    if (!arrete) {
      return NextResponse.json(
        { error: 'Arrêté introuvable' },
        { status: 404 }
      );
    }

    // Déterminer l'état en fonction du statut DB
    let state = 'waiting';
    let progress = 0;

    switch (arrete.statutIndexation) {
      case 'INDEXE':
        state = 'completed';
        progress = 100;
        break;
      case 'EN_COURS':
        state = 'active';
        progress = 50;
        break;
      case 'ERREUR':
        state = 'failed';
        progress = 0;
        break;
      default:
        state = 'waiting';
        progress = 0;
    }

    return NextResponse.json({
      id: arreteId,
      state,
      progress,
      statutIndexation: arrete.statutIndexation,
      dateIndexation: arrete.dateIndexation,
      nombreAppeles: arrete._count.appeles,
      failedReason: arrete.statutIndexation === 'ERREUR' ? arrete.messageErreur : undefined,
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du statut:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}

