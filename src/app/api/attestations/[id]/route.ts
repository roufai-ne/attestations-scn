import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import path from 'path';
import { getProjectRoot } from '@/lib/utils/path';

/**
 * GET /api/attestations/[id]
 * Récupère une attestation par son ID
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { id } = await params;

        const attestation = await prisma.attestation.findUnique({
            where: { id },
            include: {
                demande: {
                    include: {
                        appele: true,
                    },
                },
                signataire: {
                    select: {
                        id: true,
                        nom: true,
                        prenom: true,
                    },
                },
            },
        });

        if (!attestation) {
            return NextResponse.json(
                { error: 'Attestation non trouvée' },
                { status: 404 }
            );
        }

        return NextResponse.json(attestation);
    } catch (error) {
        console.error('Erreur GET attestation:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/attestations/[id]
 * Supprime une attestation (ADMIN uniquement)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();

        // Les agents et admins peuvent supprimer des attestations
        if (!session?.user || !['AGENT', 'ADMIN'].includes(session.user.role)) {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 403 }
            );
        }

        const { id } = await params;

        // Récupérer l'attestation
        const attestation = await prisma.attestation.findUnique({
            where: { id },
            include: {
                demande: true,
            },
        });

        if (!attestation) {
            return NextResponse.json(
                { error: 'Attestation non trouvée' },
                { status: 404 }
            );
        }

        // Supprimer le fichier PDF si existant
        if (attestation.fichierPath) {
            try {
                const projectRoot = getProjectRoot();
                const filePath = attestation.fichierPath.startsWith('/')
                    ? path.join(projectRoot, 'public', attestation.fichierPath)
                    : attestation.fichierPath;
                await unlink(filePath);
            } catch (err) {
                console.warn('Impossible de supprimer le fichier PDF:', err);
                // On continue même si le fichier n'existe pas
            }
        }

        // Supprimer l'attestation de la base de données
        await prisma.attestation.delete({
            where: { id },
        });

        // Remettre le statut de la demande à VALIDEE
        if (attestation.demande) {
            await prisma.demande.update({
                where: { id: attestation.demandeId },
                data: { statut: 'VALIDEE' },
            });
        }

        // Logger l'action d'audit
        await prisma.auditLog.create({
            data: {
                action: 'ATTESTATION_DELETED',
                userId: session.user.id,
                details: JSON.stringify({
                    attestationId: id,
                    numero: attestation.numero,
                    demandeId: attestation.demandeId,
                    timestamp: new Date().toISOString(),
                }),
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Attestation supprimée avec succès',
        });
    } catch (error) {
        console.error('Erreur DELETE attestation:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la suppression' },
            { status: 500 }
        );
    }
}
