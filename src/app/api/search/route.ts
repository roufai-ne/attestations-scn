import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/search
 * Recherche globale dans demandes, attestations et appelés
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('q');

        if (!query || query.length < 2) {
            return NextResponse.json({ results: [] });
        }

        const searchTerm = query.toLowerCase();

        // Recherche parallèle dans plusieurs entités
        const [demandes, attestations, appeles] = await Promise.all([
            // Recherche dans les demandes
            prisma.demande.findMany({
                where: {
                    OR: [
                        { numeroEnregistrement: { contains: searchTerm, mode: 'insensitive' } },
                        { appele: { nom: { contains: searchTerm, mode: 'insensitive' } } },
                        { appele: { prenom: { contains: searchTerm, mode: 'insensitive' } } },
                    ],
                },
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    appele: {
                        select: { nom: true, prenom: true },
                    },
                },
            }),

            // Recherche dans les attestations
            prisma.attestation.findMany({
                where: {
                    numero: { contains: searchTerm, mode: 'insensitive' },
                },
                take: 3,
                orderBy: { dateGeneration: 'desc' },
                include: {
                    demande: {
                        include: {
                            appele: {
                                select: { nom: true, prenom: true },
                            },
                        },
                    },
                },
            }),

            // Recherche dans les appelés
            prisma.appele.findMany({
                where: {
                    OR: [
                        { nom: { contains: searchTerm, mode: 'insensitive' } },
                        { prenom: { contains: searchTerm, mode: 'insensitive' } },
                        { promotion: { contains: searchTerm, mode: 'insensitive' } },
                    ],
                },
                take: 5,
                include: {
                    demande: {
                        select: { id: true, statut: true },
                    },
                },
            }),
        ]);

        // Formater les résultats
        const results = [
            ...demandes.map((d) => ({
                type: 'demande' as const,
                id: d.id,
                title: `Demande ${d.numeroEnregistrement}`,
                subtitle: d.appele ? `${d.appele.prenom} ${d.appele.nom}` : 'Sans appelé',
                url: `/agent/demandes/${d.id}`,
                statut: d.statut,
            })),
            ...attestations.map((a) => ({
                type: 'attestation' as const,
                id: a.id,
                title: `Attestation ${a.numero}`,
                subtitle: a.demande?.appele ? `${a.demande.appele.prenom} ${a.demande.appele.nom}` : '',
                url: `/agent/attestations`,
                statut: a.statut,
            })),
            ...appeles.map((a) => ({
                type: 'appele' as const,
                id: a.id,
                title: `${a.prenom} ${a.nom}`,
                subtitle: `Promotion ${a.promotion}`,
                url: a.demande ? `/agent/demandes/${a.demande.id}` : '#',
                statut: a.demande?.statut || null,
            })),
        ];

        return NextResponse.json({
            query,
            count: results.length,
            results,
        });
    } catch (error) {
        console.error('Erreur recherche globale:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la recherche' },
            { status: 500 }
        );
    }
}
