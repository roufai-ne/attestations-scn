import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';

/**
 * GET /api/attestations/[id]/download
 * Télécharge le fichier PDF d'une attestation
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !['AGENT', 'DIRECTEUR', 'ADMIN'].includes(session.user.role)) {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 403 }
            );
        }

        // Récupérer l'attestation
        const attestation = await prisma.attestation.findUnique({
            where: { id: params.id },
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

        // Lire le fichier PDF
        const pdfBuffer = await readFile(attestation.fichierPath);

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
