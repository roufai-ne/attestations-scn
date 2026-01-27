import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { excelParserService } from '@/lib/services/excel-parser.service';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { sanitizeFilename } from '@/lib/security/sanitize';
import { getProjectRoot } from '@/lib/utils/path';

// Taille maximale de fichier: 5 Mo
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * POST /api/admin/arretes/[id]/upload-appeles
 * Upload d'un fichier Excel contenant la liste des appelés pour un arrêté
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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
            select: {
                id: true,
                numero: true,
                lieuService: true,
            },
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
        const mappingJson = formData.get('mapping') as string | null;

        if (!file) {
            return NextResponse.json(
                { error: 'Aucun fichier fourni' },
                { status: 400 }
            );
        }

        // Parser le mapping si fourni
        let columnMapping = null;
        if (mappingJson) {
            try {
                columnMapping = JSON.parse(mappingJson);
                console.log('🗺️ Mapping personnalisé:', columnMapping);
            } catch (error) {
                return NextResponse.json(
                    { error: 'Format de mapping invalide' },
                    { status: 400 }
                );
            }
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

        // Vérifier la taille du fichier
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: 'Fichier trop volumineux. Taille maximale: 5 Mo' },
                { status: 413 }
            );
        }

        console.log(`📤 Upload de ${file.name} pour l'arrêté ${arrete.numero}`);

        // Sauvegarder temporairement le fichier avec nom sanitisé
        const buffer = Buffer.from(await file.arrayBuffer());
        const safeFilename = sanitizeFilename(file.name);
        const projectRoot = getProjectRoot();
        const tempFilePath = path.join(projectRoot, 'public', 'uploads', 'temp', `${Date.now()}-${safeFilename}`);

        await writeFile(tempFilePath, buffer);

        try {
            // Parser le fichier Excel avec le mapping (si fourni)
            console.log('📊 Parsing du fichier Excel...');
            const result = await excelParserService.parseExcelFile(tempFilePath, columnMapping);

            if (!result.success) {
                return NextResponse.json(
                    {
                        success: false,
                        errors: result.errors,
                        warnings: result.warnings,
                    },
                    { status: 400 }
                );
            }

            console.log(`✅ ${result.appeles.length} appelés extraits du fichier Excel`);

            // Supprimer les appelés existants pour cet arrêté
            await prisma.appeleArrete.deleteMany({
                where: { arreteId },
            });

            console.log('🗑️  Appelés existants supprimés');

            // Insérer les nouveaux appelés
            const appelesData = result.appeles.map((appele) => ({
                numero: appele.numeroOrdre,
                nom: appele.nom,
                prenoms: appele.prenoms,
                dateNaissance: appele.dateNaissance,
                lieuNaissance: appele.lieuNaissance,
                diplome: appele.diplome,
                lieuService: appele.lieuService || arrete.lieuService || null,
                arreteId: arreteId,
            }));

            await prisma.appeleArrete.createMany({
                data: appelesData,
            });

            console.log('💾 Nouveaux appelés insérés en base');

            // Mettre à jour l'arrêté
            await prisma.arrete.update({
                where: { id: arreteId },
                data: {
                    nombreAppeles: result.appeles.length,
                    statutIndexation: 'INDEXE',
                    dateIndexation: new Date(),
                    messageErreur: null,
                },
            });

            return NextResponse.json({
                success: true,
                message: `${result.appeles.length} appelés importés avec succès`,
                appeles: result.appeles.length,
                warnings: result.warnings,
            });

        } finally {
            // Nettoyer le fichier temporaire
            try {
                await unlink(tempFilePath);
            } catch (error) {
                console.warn('⚠️ Impossible de supprimer le fichier temporaire:', error);
            }
        }

    } catch (error) {
        console.error('❌ Erreur lors de l\'upload:', error);
        return NextResponse.json(
            { error: 'Erreur serveur lors du traitement du fichier' },
            { status: 500 }
        );
    }
}
