import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { appeleRechercheService } from '@/lib/services/appele-recherche.service';

/**
 * GET /api/arretes/search
 * Recherche dans les appelés de tous les arrêtés
 * Accessible aux agents de saisie, agents et admins
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || !['SAISIE', 'AGENT', 'ADMIN'].includes(session.user.role)) {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 403 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('q');
        const limit = parseInt(searchParams.get('limit') || '50');

        if (!query || query.trim().length < 2) {
            return NextResponse.json({
                results: [],
                message: 'Requête trop courte (minimum 2 caractères)',
            });
        }

        const results = await appeleRechercheService.searchAppeles(query, limit);

        return NextResponse.json({
            results,
            query,
            count: results.length,
        });

    } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
