import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';
import path from 'path';

/**
 * GET /api/attestations/[id]/download
 * Télécharge une attestation PDF
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();

        if (!session || !['AGENT', 'DIRECTEUR', 'ADMIN'].includes(session.user.role)) {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 403 }
            );
        }

        const { id } = await params;

        // Récupérer l'attestation
        const attestation = await prisma.attestation.findUnique({
            where: { id: id },
            include: {
                demande: {
                    include: {
                        appele: true,
                    },
                },
            },
        });

        if (!attestation) {
            return NextResponse.json(
                { error: 'Attestation introuvable' },
                { status: 404 }
            );
        }

        // Lire le fichier PDF - construire le chemin absolu
        let absolutePath: string;
        const fichierPath = attestation.fichierPath;

        // Vérifier si le chemin est un chemin Windows absolu contenant 'uploads'
        if (fichierPath.includes('\\uploads\\') || fichierPath.includes('/uploads/')) {
            // Extraire la partie relative du chemin
            const uploadsMatch = fichierPath.match(/[\\\/]uploads[\\\/]attestations[\\\/].+$/);
            if (uploadsMatch) {
                absolutePath = path.join(process.cwd(), 'public', uploadsMatch[0].replace(/\\/g, '/'));
            } else {
                absolutePath = path.join(process.cwd(), 'public', fichierPath);
            }
        } else if (path.isAbsolute(fichierPath)) {
            absolutePath = fichierPath;
        } else if (fichierPath.startsWith('/uploads') || fichierPath.startsWith('uploads')) {
            absolutePath = path.join(process.cwd(), 'public', fichierPath);
        } else {
            absolutePath = path.join(process.cwd(), 'public', fichierPath);
        }

        console.log('Chemin fichier stocké:', fichierPath);
        console.log('Chemin absolu résolu:', absolutePath);

        const pdfBuffer = await readFile(absolutePath);

        // Retourner le PDF
        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${attestation.numero}.pdf"`,
            },
        });

    } catch (error) {
        console.error('Erreur lors du téléchargement:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
