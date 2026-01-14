/**
 * API Route - Historique des notifications pour une demande
 * GET /api/notifications/historique/[demandeId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { notificationService } from '@/lib/notifications';

export async function GET(
  request: NextRequest,
  { params }: { params: { demandeId: string } }
) {
  try {
    // Vérifier l'authentification
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { demandeId } = params;

    if (!demandeId) {
      return NextResponse.json(
        { error: 'ID de demande manquant' },
        { status: 400 }
      );
    }

    // Récupérer l'historique
    const historique = await notificationService.getHistorique(demandeId);

    return NextResponse.json(historique);
  } catch (error) {
    console.error('Erreur API historique notifications:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
