import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { StatutIndexation } from '@prisma/client';

/**
 * POST /api/admin/arretes/reindex-all
 * Marque tous les arrêtés pour vérification
 * Note: La logique OCR a été remplacée par l'import Excel
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 403 }
            );
        }

        const body = await request.json().catch(() => ({}));
        const { onlyErrors = false } = body;

        // Compter les arrêtés concernés
        const whereClause = onlyErrors
            ? { statutIndexation: StatutIndexation.ERREUR }
            : {};

        const count = await prisma.arrete.count({
            where: whereClause,
        });

        if (count === 0) {
            return NextResponse.json({
                success: true,
                message: 'Aucun arrêté à traiter',
                processed: 0,
            });
        }

        // Pour la nouvelle logique basée sur Excel, on récupère les stats des arrêtés
        const arretes = await prisma.arrete.findMany({
            where: whereClause,
            select: {
                id: true,
                numero: true,
                statutIndexation: true,
                _count: {
                    select: { appeles: true }
                }
            },
        });

        // Mettre à jour le statut des arrêtés qui ont des appelés
        const results = {
            total: arretes.length,
            indexed: 0,
            pending: 0,
        };

        for (const arrete of arretes) {
            if (arrete._count.appeles > 0) {
                // Arrêté avec appelés = indexé
                await prisma.arrete.update({
                    where: { id: arrete.id },
                    data: {
                        statutIndexation: StatutIndexation.INDEXE,
                        dateIndexation: new Date(),
                    },
                });
                results.indexed++;
            } else {
                // Arrêté sans appelés = en attente d'import Excel
                await prisma.arrete.update({
                    where: { id: arrete.id },
                    data: {
                        statutIndexation: StatutIndexation.EN_ATTENTE,
                    },
                });
                results.pending++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Synchronisation terminée: ${results.indexed} indexés, ${results.pending} en attente d'import`,
            processed: results.total,
            indexed: results.indexed,
            pending: results.pending,
        });

    } catch (error) {
        console.error('Erreur synchronisation arrêtés:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la synchronisation' },
            { status: 500 }
        );
    }
}
