/**
 * API Routes - Gestion des templates d'attestation
 * GET: Liste tous les templates
 * POST: Crée un nouveau template
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { templateService } from '@/lib/services/template.service';

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            );
        }

        const templates = await templateService.getAll();

        // Parser les configurations
        const templatesWithConfig = templates.map((t) => ({
            ...t,
            config: templateService.parseConfig(t),
        }));

        return NextResponse.json(templatesWithConfig);
    } catch (error) {
        console.error('Erreur GET templates:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const nom = formData.get('nom') as string;
        const description = formData.get('description') as string;
        const backgroundFile = formData.get('background') as File;

        if (!nom) {
            return NextResponse.json(
                { error: 'Le nom est requis' },
                { status: 400 }
            );
        }

        if (!backgroundFile) {
            return NextResponse.json(
                { error: 'L\'image de fond est requise' },
                { status: 400 }
            );
        }

        // Valider le type de fichier
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!validTypes.includes(backgroundFile.type)) {
            return NextResponse.json(
                { error: 'Format invalide. Utilisez PNG ou JPG.' },
                { status: 400 }
            );
        }

        // Convertir en buffer
        const buffer = Buffer.from(await backgroundFile.arrayBuffer());

        const template = await templateService.create({
            nom,
            description,
            backgroundImage: buffer,
            backgroundFilename: backgroundFile.name,
        });

        return NextResponse.json(template, { status: 201 });
    } catch (error) {
        console.error('Erreur POST template:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
