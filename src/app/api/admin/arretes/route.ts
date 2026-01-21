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
 * Création d'un nouvel arrêté (sans fichier - système Excel)
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
        const numero = formData.get('numero') as string;
        const dateArrete = formData.get('dateArrete') as string;
        const promotion = formData.get('promotion') as string;
        const annee = formData.get('annee') as string;
        const lieuService = formData.get('lieuService') as string | null;

        // Validation
        const validatedData = createArreteSchema.parse({
            numero,
            dateArrete,
            promotion,
            annee,
        });

        // Créer l'arrêté dans la base de données (système Excel - pas de fichier PDF)
        const arrete = await arreteService.createArrete({
            ...validatedData,
            lieuService: lieuService || undefined,
            fichierPath: null, // Pas de PDF, les appelés seront importés via Excel
            statutIndexation: 'INDEXED' as any, // Marqué comme indexé car pas besoin d'OCR
        });

        return NextResponse.json(
            {
                success: true,
                arrete,
                message: 'Arrêté créé avec succès. Vous pouvez maintenant importer les appelés depuis Excel.',
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
