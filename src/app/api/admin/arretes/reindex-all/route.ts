import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { StatutIndexation, Prisma } from '@prisma/client';
import { pdfTextExtractor } from '@/lib/services/pdf-text-extractor.service';
import path from 'path';

/**
 * POST /api/admin/arretes/reindex-all
 * Ré-indexe tous les arrêtés ou ceux en erreur
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

        // Récupérer les arrêtés à ré-indexer
        const whereClause: Prisma.ArreteWhereInput = onlyErrors
            ? { statutIndexation: StatutIndexation.ERREUR }
            : {}; // Tous les arrêtés

        const arretes = await prisma.arrete.findMany({
            where: whereClause,
            select: {
                id: true,
                numero: true,
                fichierPath: true,
                statutIndexation: true,
            },
        });

        if (arretes.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'Aucun arrêté à ré-indexer',
                processed: 0,
                errors: 0,
            });
        }

        // Traitement en background (ne pas bloquer la réponse)
        const results = {
            total: arretes.length,
            successCount: 0,
            errorCount: 0,
            details: [] as { id: string; numero: string; status: 'success' | 'error'; error?: string }[],
        };

        // Traiter chaque arrêté
        for (const arrete of arretes) {
            try {
                // Mettre le statut à EN_COURS
                await prisma.arrete.update({
                    where: { id: arrete.id },
                    data: { statutIndexation: StatutIndexation.EN_COURS },
                });

                // Construire le chemin absolu du fichier
                const absolutePath = path.join(process.cwd(), 'public', arrete.fichierPath);

                // Extraction de texte du PDF
                const extractResult = await pdfTextExtractor.extractText(absolutePath);

                if (extractResult.hasText) {
                    // Mettre à jour avec le contenu extrait
                    await prisma.arrete.update({
                        where: { id: arrete.id },
                        data: {
                            contenuOCR: pdfTextExtractor.cleanText(extractResult.text),
                            statutIndexation: StatutIndexation.INDEXE,
                            dateIndexation: new Date(),
                        },
                    });

                    results.successCount++;
                    results.details.push({
                        id: arrete.id,
                        numero: arrete.numero,
                        status: 'success',
                    });
                } else {
                    // PDF sans texte extractible
                    await prisma.arrete.update({
                        where: { id: arrete.id },
                        data: {
                            statutIndexation: StatutIndexation.ERREUR,
                            messageErreur: 'PDF scanné - texte non extractible',
                        },
                    });

                    results.errorCount++;
                    results.details.push({
                        id: arrete.id,
                        numero: arrete.numero,
                        status: 'error',
                        error: 'PDF scanné - texte non extractible',
                    });
                }

            } catch (error) {
                // En cas d'erreur, marquer comme ERREUR
                await prisma.arrete.update({
                    where: { id: arrete.id },
                    data: {
                        statutIndexation: StatutIndexation.ERREUR,
                        messageErreur: error instanceof Error ? error.message : 'Erreur inconnue',
                    },
                });

                results.errorCount++;
                results.details.push({
                    id: arrete.id,
                    numero: arrete.numero,
                    status: 'error',
                    error: error instanceof Error ? error.message : 'Erreur inconnue',
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Ré-indexation terminée: ${results.successCount} succès, ${results.errorCount} erreurs`,
            processed: results.total,
            successCount: results.successCount,
            errorCount: results.errorCount,
            details: results.details,
        });

    } catch (error) {
        console.error('Erreur ré-indexation en lot:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la ré-indexation' },
            { status: 500 }
        );
    }
}
