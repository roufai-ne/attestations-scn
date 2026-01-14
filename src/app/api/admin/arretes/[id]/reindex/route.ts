import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { arreteService } from '@/lib/services/arrete.service';

/**
 * POST /api/admin/arretes/[id]/reindex
 * Relance l'indexation OCR d'un arrêté
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 403 }
            );
        }

        await arreteService.reindexArrete(params.id);

        return NextResponse.json({
            success: true,
            message: 'Réindexation lancée avec succès',
        });

    } catch (error) {
        console.error('Erreur lors de la réindexation:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Erreur serveur' },
            { status: 500 }
        );
    }
}
