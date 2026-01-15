import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { arreteService } from '@/lib/services/arrete.service';
import { z } from 'zod';

// Schéma de validation pour la mise à jour
const updateArreteSchema = z.object({
    numero: z.string().min(1).optional(),
    dateArrete: z.string().transform((val) => new Date(val)).optional(),
    promotion: z.string().min(1).optional(),
    annee: z.string().min(4).optional(),
});

/**
 * GET /api/admin/arretes/[id]
 * Récupère les détails d'un arrêté
 */
export async function GET(
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
        const arrete = await arreteService.getArreteById(id);

        if (!arrete) {
            return NextResponse.json(
                { error: 'Arrêté introuvable' },
                { status: 404 }
            );
        }

        return NextResponse.json(arrete);

    } catch (error) {
        console.error('Erreur lors de la récupération de l\'arrêté:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/admin/arretes/[id]
 * Met à jour les métadonnées d'un arrêté
 */
export async function PUT(
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

        const body = await request.json();
        const validatedData = updateArreteSchema.parse(body);

        const { id } = await params;
        const arrete = await arreteService.updateArrete(id, validatedData);

        return NextResponse.json({
            success: true,
            arrete,
            message: 'Arrêté mis à jour avec succès',
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'arrêté:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Données invalides', details: error.issues },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/arretes/[id]
 * Supprime un arrêté et son fichier
 */
export async function DELETE(
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
        await arreteService.deleteArrete(id);

        return NextResponse.json({
            success: true,
            message: 'Arrêté supprimé avec succès',
        });

    } catch (error) {
        console.error('Erreur lors de la suppression de l\'arrêté:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
