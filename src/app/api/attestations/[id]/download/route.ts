import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';
import path from 'path';
import { getProjectRoot } from '@/lib/utils/path';

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
        const projectRoot = getProjectRoot();
        let absolutePath: string;
        const fichierPath = attestation.fichierPath;

        // Si le chemin commence par /uploads/, le résoudre depuis la racine du projet
        if (fichierPath.startsWith('/uploads/') || fichierPath.startsWith('uploads/')) {
            absolutePath = path.join(projectRoot, 'public', fichierPath.replace(/^\//, ''));
        } 
        // Si c'est un chemin absolu du système de fichiers
        else if (path.isAbsolute(fichierPath)) {
            absolutePath = fichierPath;
        } 
        // Sinon, traiter comme un chemin relatif depuis public
        else {
            absolutePath = path.join(projectRoot, 'public', fichierPath);
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
