import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { arreteService } from '@/lib/services/arrete.service';

/**
 * GET /api/arretes/search
 * Recherche dans le contenu OCR des arrêtés
 * Accessible aux agents et admins
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !['AGENT', 'ADMIN'].includes(session.user.role)) {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 403 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('q');
        const limit = parseInt(searchParams.get('limit') || '10');

        if (!query || query.trim().length < 2) {
            return NextResponse.json({
                results: [],
                message: 'Requête trop courte (minimum 2 caractères)',
            });
        }

        const results = await arreteService.searchInArretes(query, limit);

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
