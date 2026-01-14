import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { signatureService } from '@/lib/services/signature.service';

/**
 * POST /api/directeur/attestations/signer-lot
 * Signe plusieurs attestations en lot
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'DIRECTEUR') {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { attestationIds, pin } = body;

        if (!attestationIds || !Array.isArray(attestationIds) || attestationIds.length === 0) {
            return NextResponse.json(
                { error: 'Liste d\'attestations manquante' },
                { status: 400 }
            );
        }

        if (!pin) {
            return NextResponse.json(
                { error: 'PIN manquant' },
                { status: 400 }
            );
        }

        // Signer en lot
        const results = await signatureService.signAttestationsLot(
            attestationIds,
            session.user.id,
            pin
        );

        return NextResponse.json({
            success: true,
            message: `${results.success.length} attestation(s) signée(s)`,
            results: {
                signees: results.success.length,
                erreurs: results.errors.length,
                details: results.errors,
            },
        });
    } catch (error) {
        console.error('Erreur lors de la signature en lot:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Erreur serveur' },
            { status: 500 }
        );
    }
}
