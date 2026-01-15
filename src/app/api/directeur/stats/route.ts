import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { statsService } from '@/lib/services/stats.service';

/**
 * GET /api/directeur/stats
 * Récupère les statistiques pour le directeur
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'DIRECTEUR') {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 403 }
            );
        }

        const stats = await statsService.getDirecteurStats();

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Erreur lors de la récupération des stats:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
