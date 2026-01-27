import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { signatureService } from '@/lib/services/signature.service';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getProjectRoot } from '@/lib/utils/path';

/**
 * GET /api/directeur/signature/config
 * Récupère la configuration de signature du directeur
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

        const config = await signatureService.getConfig(session.user.id);

        if (!config) {
            return NextResponse.json(
                { configured: false },
                { status: 200 }
            );
        }

        // Ne pas renvoyer le hash du PIN
        const { pinHash, ...safeConfig } = config;

        return NextResponse.json({
            configured: true,
            config: safeConfig,
        });
    } catch (error) {
        console.error('Erreur lors de la récupération de la config:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/directeur/signature/config
 * Crée ou met à jour la configuration de signature
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'DIRECTEUR') {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 403 }
            );
        }

        const formData = await request.formData();
        const signatureImage = formData.get('signatureImage') as File;
        const texteSignature = formData.get('texteSignature') as string;
        const pin = formData.get('pin') as string;

        // Validation - les positions sont maintenant gérées par l'admin dans le template
        if (!texteSignature || !pin) {
            return NextResponse.json(
                { error: 'Données manquantes' },
                { status: 400 }
            );
        }

        // Valider le PIN (4-6 chiffres)
        if (!/^\d{4,6}$/.test(pin)) {
            return NextResponse.json(
                { error: 'Le PIN doit contenir 4 à 6 chiffres' },
                { status: 400 }
            );
        }

        // Gérer l'image de signature
        let signatureImagePath: string | undefined;

        if (signatureImage && signatureImage.size > 0) {
            // Créer le dossier de signatures s'il n'existe pas
            const projectRoot = getProjectRoot();
            const signaturesDir = path.join(projectRoot, 'public', 'uploads', 'signatures');
            await mkdir(signaturesDir, { recursive: true });

            // Sauvegarder l'image
            const bytes = await signatureImage.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const filename = `signature-${session.user.id}-${Date.now()}.png`;
            const filepath = path.join(signaturesDir, filename);

            await writeFile(filepath, buffer);
            signatureImagePath = `/uploads/signatures/${filename}`;
        }

        // Créer/mettre à jour la configuration (sans les positions - gérées par le template)
        const config = await signatureService.createOrUpdateConfig(session.user.id, {
            signatureImagePath: signatureImagePath,
            texteSignature,
            pin,
        });

        return NextResponse.json({
            success: true,
            message: 'Configuration de signature enregistrée',
            config: {
                id: config.id,
                texteSignature: config.texteSignature,
                isEnabled: config.isEnabled,
            },
        });
    } catch (error) {
        console.error('Erreur lors de la configuration:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Erreur serveur' },
            { status: 500 }
        );
    }
}
