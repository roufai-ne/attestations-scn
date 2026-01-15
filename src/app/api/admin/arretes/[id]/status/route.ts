import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getOCRJobStatus } from '@/lib/services/queue.service';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/arretes/[id]/status
 * Récupère le statut d'indexation OCR en temps réel
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

    // Récupérer l'arrêté depuis la BDD pour avoir son statut actuel
    const arrete = await prisma.arrete.findUnique({
      where: { id: arreteId },
      select: {
        id: true,
        numero: true,
        statutIndexation: true,
        messageErreur: true,
        dateIndexation: true,
      },
    });

    if (!arrete) {
      return NextResponse.json(
        { error: 'Arrêté introuvable' },
        { status: 404 }
      );
    }

    // Si le statut de la BDD est final, retourner directement
    if (arrete.statutIndexation === 'INDEXE') {
      return NextResponse.json({
        id: arreteId,
        state: 'completed',
        progress: 100,
        statutIndexation: arrete.statutIndexation,
        dateIndexation: arrete.dateIndexation,
      });
    }

    if (arrete.statutIndexation === 'ERREUR') {
      return NextResponse.json({
        id: arreteId,
        state: 'failed',
        progress: 0,
        statutIndexation: arrete.statutIndexation,
        failedReason: arrete.messageErreur || 'Erreur inconnue',
      });
    }

    // Essayer de récupérer le statut du job dans la queue
    let jobStatus = null;
    try {
      jobStatus = await getOCRJobStatus(arreteId);
    } catch (queueError) {
      console.warn('Queue Redis non disponible, utilisation du statut BDD uniquement');
    }

    // Si pas de job dans la queue mais statut EN_ATTENTE ou EN_COURS
    if (!jobStatus) {
      return NextResponse.json({
        id: arreteId,
        state: arrete.statutIndexation === 'EN_COURS' ? 'active' : 'waiting',
        progress: arrete.statutIndexation === 'EN_COURS' ? 10 : 0,
        statutIndexation: arrete.statutIndexation,
      });
    }

    // Retourner le statut du job
    return NextResponse.json({
      ...jobStatus,
      statutIndexation: arrete.statutIndexation,
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du statut:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}
