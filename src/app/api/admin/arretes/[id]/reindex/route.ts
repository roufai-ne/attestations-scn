import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { StatutIndexation } from '@prisma/client';

/**
 * POST /api/admin/arretes/[id]/reindex
 * Met à jour le statut d'indexation d'un arrêté en fonction des appelés
 * Note: La logique OCR a été remplacée par l'import Excel
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 403 }
            );
        }

        const { id } = await params;

        // Récupérer l'arrêté avec le nombre d'appelés
        const arrete = await prisma.arrete.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { appeles: true }
                }
            }
        });

        if (!arrete) {
            return NextResponse.json(
                { error: 'Arrêté introuvable' },
                { status: 404 }
            );
        }

        // Mettre à jour le statut en fonction des appelés
        const newStatus = arrete._count.appeles > 0
            ? StatutIndexation.INDEXE
            : StatutIndexation.EN_ATTENTE;

        await prisma.arrete.update({
            where: { id },
            data: {
                statutIndexation: newStatus,
                dateIndexation: arrete._count.appeles > 0 ? new Date() : null,
                messageErreur: null,
            },
        });

        return NextResponse.json({
            success: true,
            message: arrete._count.appeles > 0
                ? `Arrêté indexé avec ${arrete._count.appeles} appelés`
                : 'Arrêté en attente d\'import Excel',
            nombreAppeles: arrete._count.appeles,
            statutIndexation: newStatus,
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Erreur serveur' },
            { status: 500 }
        );
    }
}
