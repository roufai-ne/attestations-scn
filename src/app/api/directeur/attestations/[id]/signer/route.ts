import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { signatureService } from '@/lib/services/signature.service';

/**
 * POST /api/directeur/attestations/[id]/signer
 * Signe une attestation
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'DIRECTEUR') {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { pin } = body;

        if (!pin) {
            return NextResponse.json(
                { error: 'PIN manquant' },
                { status: 400 }
            );
        }

        // Signer l'attestation
        const attestation = await signatureService.signAttestation(
            params.id,
            session.user.id,
            pin
        );

        return NextResponse.json({
            success: true,
            message: 'Attestation signée avec succès',
            attestation: {
                id: attestation.id,
                numero: attestation.numero,
                statut: attestation.statut,
                dateSignature: attestation.dateSignature,
            },
        });
    } catch (error) {
        console.error('Erreur lors de la signature:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Erreur serveur' },
            { status: 500 }
        );
    }
}
