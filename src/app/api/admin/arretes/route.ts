import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { arreteService } from '@/lib/services/arrete.service';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { z } from 'zod';

// Schéma de validation pour la création d'un arrêté
const createArreteSchema = z.object({
    numero: z.string().min(1, 'Le numéro est obligatoire'),
    dateArrete: z.string().transform((val) => new Date(val)),
    promotion: z.string().min(1, 'La promotion est obligatoire'),
    annee: z.string().min(4, 'L\'année est obligatoire'),
});

/**
 * GET /api/admin/arretes
 * Liste les arrêtés avec pagination et filtres
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 403 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const statut = searchParams.get('statut') as any;
        const promotion = searchParams.get('promotion') || undefined;
        const annee = searchParams.get('annee') || undefined;
        const search = searchParams.get('search') || undefined;

        const result = await arreteService.listArretes({
            page,
            limit,
            statut,
            promotion,
            annee,
            search,
        });

        return NextResponse.json(result);

    } catch (error) {
        console.error('Erreur lors de la récupération des arrêtés:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/arretes
 * Upload et création d'un nouvel arrêté
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

        // Parser le form data
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const numero = formData.get('numero') as string;
        const dateArrete = formData.get('dateArrete') as string;
        const promotion = formData.get('promotion') as string;
        const annee = formData.get('annee') as string;

        // Validation
        if (!file) {
            return NextResponse.json(
                { error: 'Fichier PDF requis' },
                { status: 400 }
            );
        }

        if (!file.name.toLowerCase().endsWith('.pdf')) {
            return NextResponse.json(
                { error: 'Seuls les fichiers PDF sont acceptés' },
                { status: 400 }
            );
        }

        const validatedData = createArreteSchema.parse({
            numero,
            dateArrete,
            promotion,
            annee,
        });

        // Créer le dossier d'upload s'il n'existe pas
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'arretes');
        await mkdir(uploadDir, { recursive: true });

        // Générer un nom de fichier unique
        const timestamp = Date.now();
        const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${timestamp}_${sanitizedFilename}`;
        const filePath = path.join(uploadDir, filename);

        // Sauvegarder le fichier
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        console.log(`📁 Fichier sauvegardé: ${filePath}`);

        // Créer l'arrêté dans la base de données et lancer l'OCR
        const arrete = await arreteService.createArrete({
            ...validatedData,
            fichierPath: filePath,
        });

        return NextResponse.json(
            {
                success: true,
                arrete,
                message: 'Arrêté créé avec succès. L\'indexation OCR est en cours.',
            },
            { status: 201 }
        );

    } catch (error) {
        console.error('Erreur lors de la création de l\'arrêté:', error);

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
