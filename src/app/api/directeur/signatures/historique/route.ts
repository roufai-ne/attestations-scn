import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { signatureService } from '@/lib/services/signature.service';

/**
 * GET /api/directeur/signatures/historique
 * Récupère l'historique des signatures du directeur
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

        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const dateDebut = searchParams.get('dateDebut');
        const dateFin = searchParams.get('dateFin');

        const options: any = { page, limit };
        if (dateDebut) options.dateDebut = new Date(dateDebut);
        if (dateFin) options.dateFin = new Date(dateFin);

        const result = await signatureService.getHistoriqueSignatures(
            session.user.id,
            options
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error('Erreur récupération historique signatures:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
