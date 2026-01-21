import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/demandes/counts
 * Retourne le nombre de demandes par statut
 */
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        // Compter les demandes par statut
        const counts = await prisma.demande.groupBy({
            by: ['statut'],
            _count: {
                statut: true,
            },
        });

        // Formater la réponse
        const result = counts.map((item) => ({
            statut: item.statut,
            count: item._count.statut,
        }));

        return NextResponse.json(result);
    } catch (error) {
        console.error('Erreur compteurs demandes:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
