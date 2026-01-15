import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/config/attestation
 * Récupère la configuration du modèle d'attestation
 */
export async function GET() {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 403 }
            );
        }

        // Récupérer la config depuis la table de configuration
        const configRecord = await prisma.configSystem.findUnique({
            where: { cle: 'attestation_template' },
        });

        if (configRecord) {
            return NextResponse.json({
                config: JSON.parse(configRecord.valeur),
            });
        }

        return NextResponse.json({ config: null });

    } catch (error) {
        console.error('Erreur lors de la récupération de la config:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/config/attestation
 * Sauvegarde la configuration du modèle d'attestation
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

        const { config } = await request.json();

        if (!config) {
            return NextResponse.json(
                { error: 'Configuration manquante' },
                { status: 400 }
            );
        }

        // Sauvegarder dans la table de configuration
        await prisma.configSystem.upsert({
            where: { cle: 'attestation_template' },
            update: {
                valeur: JSON.stringify(config),
            },
            create: {
                cle: 'attestation_template',
                valeur: JSON.stringify(config),
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Configuration sauvegardée',
        });

    } catch (error) {
        console.error('Erreur lors de la sauvegarde de la config:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
