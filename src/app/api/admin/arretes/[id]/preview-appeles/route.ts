import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { excelParserService } from '@/lib/services/excel-parser.service';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { getProjectRoot } from '@/lib/utils/path';

/**
 * POST /api/admin/arretes/[id]/preview-appeles
 * Analyse un fichier Excel et propose un mapping des colonnes
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    let tempFilePath: string | null = null;

    try {
        // Vérification de l'authentification et des permissions
        const session = await auth();
        if (!session || !['ADMIN', 'SAISIE'].includes(session.user.role)) {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 403 }
            );
        }

        const { id: arreteId } = await params;

        // Vérifier que l'arrêté existe
        const arrete = await prisma.arrete.findUnique({
            where: { id: arreteId },
            select: { id: true, numero: true },
        });

        if (!arrete) {
            return NextResponse.json(
                { error: 'Arrêté introuvable' },
                { status: 404 }
            );
        }

        // Récupérer le fichier du formulaire
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'Aucun fichier fourni' },
                { status: 400 }
            );
        }

        // Vérifier le type de fichier
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
        ];

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Type de fichier non supporté. Utilisez .xlsx ou .xls' },
                { status: 400 }
            );
        }

        console.log(`🔍 Preview de ${file.name} pour l'arrêté ${arrete.numero}`);

        // Sauvegarder temporairement le fichier
        const buffer = Buffer.from(await file.arrayBuffer());
        const projectRoot = getProjectRoot();
        tempFilePath = path.join(projectRoot, 'public', 'uploads', 'temp', `preview-${Date.now()}-${file.name}`);

        await writeFile(tempFilePath, buffer);

        // Analyser le fichier
        const preview = await excelParserService.previewExcelFile(tempFilePath);

        console.log(`✅ Preview généré: ${preview.totalRows} lignes, ${preview.headers.length} colonnes`);

        return NextResponse.json({
            success: true,
            preview,
        });

    } catch (error) {
        console.error('❌ Erreur lors du preview:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Erreur inconnue',
            },
            { status: 500 }
        );
    } finally {
        // Nettoyer le fichier temporaire
        if (tempFilePath) {
            try {
                await unlink(tempFilePath);
            } catch (err) {
                console.warn('⚠️ Impossible de supprimer le fichier temporaire:', err);
            }
        }
    }
}
