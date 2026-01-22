import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { appeleRechercheService } from '@/lib/services/appele-recherche.service';

/**
 * GET /api/admin/arretes/[id]/appeles
 * Liste tous les appelés d'un arrêté
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();

        if (!session || !['ADMIN', 'SAISIE', 'AGENT'].includes(session.user.role)) {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 403 }
            );
        }

        const { id } = await params;
        const appeles = await appeleRechercheService.listeParArrete(id);

        return NextResponse.json({
            appeles,
            count: appeles.length,
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des appelés:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
